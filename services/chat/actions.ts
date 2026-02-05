"use server";

import { eq, and, or } from "drizzle-orm";

import { db } from "@/db";
import { pusher } from "@/lib/pusher";
import { authenticatedAction } from "@/lib/safe-action";
import { conversations, messages } from "@/db/schema";
import { getItemById } from "@/data/items";
import type { SendMessageInput, SendFirstMessageInput } from "@/db/validation";

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
            await pusher.trigger(
                `user-${sellerId}`, // channel specific to the seller
                "new-message", // event name
                {
                    conversationId: result.conversationId,
                    senderName: session.user.name,
                    content: result.newMessage.content,
                    timestamp: new Date().toISOString(),
                },
            );

            return {
                success: true,
                message: "Message sent successfully",
                data: {
                    conversationId: result.conversationId,
                },
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

            // verify conversation exists and user is a participant
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

            // insert the message
            const [newMessage] = await db
                .insert(messages)
                .values({
                    conversationId,
                    senderId: userId,
                    content,
                })
                .returning();

            // update conversation (last message and updatedAt)
            await db
                .update(conversations)
                .set({
                    lastMessageId: newMessage.id,
                    updatedAt: new Date(),
                })
                .where(eq(conversations.id, conversationId));

            // trigger real-time event
            // fast update for active window
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

            // notify recipient so they get notified even if not in chat window
            const recipientId =
                userId === conversation.participantOneId
                    ? conversation.participantTwoId
                    : conversation.participantOneId;

            await pusher.trigger(`user-${recipientId}`, "inbox-update", {
                conversationId,
                lastMessage: content,
                updatedAt: new Date(),
            });

            return {
                success: true,
                message: "Message sent successfully",
                data: {
                    newMessage: newMessage,
                },
            };
        },
    );
};
export type SendMessageResult = Awaited<ReturnType<typeof sendMessage>>;
