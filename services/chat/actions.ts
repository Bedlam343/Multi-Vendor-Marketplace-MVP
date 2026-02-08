"use server";

import { eq, and, or, ne } from "drizzle-orm";

import { db } from "@/db";
import { pusher } from "@/lib/pusher";
import { authenticatedAction } from "@/lib/safe-action";
import { conversations, messages } from "@/db/schema";
import { getItemById } from "@/data/items";
import type { SendMessageInput, SendFirstMessageInput } from "@/db/validation";
import { getUnreadMessageCount } from "@/services/chat/queries";

// helper function
async function broadcastUnreadCount(userId: string) {
    const count = await getUnreadMessageCount(userId);
    console.log("Bradcasting unread count for user", userId, "Count:", count);
    await pusher.trigger(`user-${userId}`, "unread-update", { count });
}

export async function sendFirstMessage(input: SendFirstMessageInput) {
    return authenticatedAction(input, async ({ itemId, content }, session) => {
        const userId = session.user.id;

        const item = await getItemById(itemId);
        if (!item || !item.seller)
            return { success: false, message: "Item not found" };

        const sellerId = item.seller.id;
        if (sellerId === userId)
            return { success: false, message: "Cannot message yourself" };

        try {
            const result = await db.transaction(async (tx) => {
                let conversationId: string;

                // race condition safe check for existing conversation
                const existingConversation =
                    await tx.query.conversations.findFirst({
                        where: and(
                            eq(conversations.itemId, itemId),
                            or(
                                and(
                                    eq(conversations.participantOneId, userId),
                                    eq(
                                        conversations.participantTwoId,
                                        sellerId,
                                    ),
                                ),
                                and(
                                    eq(
                                        conversations.participantOneId,
                                        sellerId,
                                    ),
                                    eq(conversations.participantTwoId, userId),
                                ),
                            ),
                        ),
                    });

                if (existingConversation) {
                    conversationId = existingConversation.id;
                } else {
                    const [newConversation] = await tx
                        .insert(conversations)
                        .values({
                            itemId,
                            participantOneId: userId,
                            participantTwoId: sellerId,
                        })
                        .returning();

                    conversationId = newConversation.id;
                }

                // insert the message
                const [newMessage] = await tx
                    .insert(messages)
                    .values({
                        conversationId,
                        senderId: userId,
                        content,
                    })
                    .returning();

                // update conversation (last message and updatedAt)
                await tx
                    .update(conversations)
                    .set({
                        lastMessageId: newMessage.id,
                        updatedAt: new Date(),
                    })
                    .where(eq(conversations.id, conversationId));

                return { conversationId, newMessage };
            });

            // trigger pusher
            await pusher.trigger(`user-${sellerId}`, "new-message", {
                conversationId: result.conversationId,
                content: content,
                timestamp: new Date().toISOString(),

                // Add the missing pieces so the UI can render instantly
                senderId: session.user.id,
                senderName: session.user.name,
                senderImage: session.user.image, // 📸

                itemId: item.id,
                itemTitle: item.title, // 📦
                itemPrice: item.price,
                itemImage: item.images?.[0] || null,
            });

            // Update Seller's Unread Count
            await broadcastUnreadCount(sellerId);

            return {
                success: true,
                message: "Message sent successfully",
                data: { conversationId: result.conversationId },
            };
        } catch (error) {
            console.error("Failed to send message:", error);
            return { success: false, message: "Failed to send message" };
        }
    });
}

export const sendMessage = async (input: SendMessageInput) => {
    return authenticatedAction(
        input,
        async ({ conversationId, content }, session) => {
            const userId = session.user.id;

            // 1. Verify conversation
            const conversation = await db.query.conversations.findFirst({
                where: eq(conversations.id, conversationId),
                columns: { participantOneId: true, participantTwoId: true },
            });
            if (!conversation)
                return { success: false, message: "Chat not found" };

            const isParticipant =
                conversation.participantOneId === userId ||
                conversation.participantTwoId === userId;

            if (!isParticipant)
                return { success: false, message: "Unauthorized" };

            // 2. Insert Message
            const [newMessage] = await db
                .insert(messages)
                .values({
                    conversationId,
                    senderId: userId,
                    content,
                })
                .returning();

            // 3. Update Conversation
            await db
                .update(conversations)
                .set({
                    lastMessageId: newMessage.id,
                    updatedAt: new Date(),
                })
                .where(eq(conversations.id, conversationId));

            // Trigger "Chat Room" Update (for open windows)
            await pusher.trigger(
                `conversation-${conversationId}`,
                "new-message",
                {
                    id: newMessage.id,
                    content: newMessage.content,
                    senderId: newMessage.senderId,
                    createdAt: newMessage.createdAt,
                },
            );

            const recipientId =
                userId === conversation.participantOneId
                    ? conversation.participantTwoId
                    : conversation.participantOneId;

            // Trigger "Inbox Update" for recipient
            await pusher.trigger(`user-${recipientId}`, "inbox-update", {
                conversationId,
                lastMessage: content,
                updatedAt: new Date(),
            });

            await broadcastUnreadCount(recipientId);

            return {
                success: true,
                message: "Message sent successfully",
                data: { newMessage },
            };
        },
    );
};
export type SendMessageResult = Awaited<ReturnType<typeof sendMessage>>;

export const markMessagesAsRead = async (conversationId: string) => {
    return authenticatedAction(conversationId, async (convId, session) => {
        try {
            const userId = session.user.id;

            const conversation = await db.query.conversations.findFirst({
                where: eq(conversations.id, conversationId),
                columns: { participantOneId: true, participantTwoId: true },
            });
            if (!conversation) {
                return { success: false, message: "Chat not found" };
            }

            const isParticipant =
                conversation.participantOneId === userId ||
                conversation.participantTwoId === userId;
            if (!isParticipant) {
                return { success: false, message: "Unauthorized" };
            }

            await db
                .update(messages)
                .set({ read: true })
                .where(
                    and(
                        eq(messages.conversationId, conversationId),
                        eq(messages.read, false),
                        ne(messages.senderId, userId), // Only mark OTHER people's messages
                    ),
                );

            // Broadcast New Count to Current User
            await broadcastUnreadCount(userId);

            await pusher.trigger(`user-${userId}`, "conversation-read", {
                conversationId,
            });

            return { success: true, message: "Messages marked as read" };
        } catch (error) {
            console.error("Failed to mark messages as read:", error);
            return {
                success: false,
                message: "Failed to mark messages as read",
            };
        }
    });
};
