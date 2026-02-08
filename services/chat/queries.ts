import "server-only";

import { eq, or, desc, count, ne, and } from "drizzle-orm";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { authenticatedQuery } from "@/lib/safe-query";
// import { authenticatedQuery } from "@/lib/safe-query";

export async function getUserConversations(userId: string) {
    const results = await db.query.conversations.findMany({
        where: or(
            eq(conversations.participantOneId, userId),
            eq(conversations.participantTwoId, userId),
        ),

        with: {
            item: true,
            participantOne: true,
            participantTwo: true,
            lastMessage: true,
        },
        orderBy: [desc(conversations.updatedAt)],
    });

    const formatted = results.map((conv) => {
        const isUserOne = conv.participantOneId === userId;
        const otherUser = isUserOne ? conv.participantTwo : conv.participantOne;
        const lastMessage = conv.lastMessage;

        return {
            id: conv.id,
            updatedAt: conv.updatedAt,
            item: {
                id: conv.item.id,
                title: conv.item.title,
                image: conv.item.images?.[0] || null,
                price: conv.item.price,
            },
            otherUser: {
                id: otherUser.id,
                name: otherUser.name,
                image: otherUser.image,
            },

            hasUnread: lastMessage
                ? lastMessage.senderId !== userId && !lastMessage.read
                : false,

            lastMessage: conv.lastMessage?.content || "Started a conversation",
        };
    });

    return formatted;
}
export type ConversationSnippets = Awaited<
    ReturnType<typeof getUserConversations>
>;

export async function getUnreadMessageCount(userId: string): Promise<number> {
    return authenticatedQuery(userId, async (id, session) => {
        const [result] = await db
            .select({ count: count() })
            .from(messages)
            .leftJoin(
                conversations,
                eq(messages.conversationId, conversations.id),
            )
            .where(
                and(
                    eq(messages.read, false),
                    ne(messages.senderId, id),
                    or(
                        eq(conversations.participantOneId, id),
                        eq(conversations.participantTwoId, id),
                    ),
                ),
            );

        return result?.count || 0;
    });
}
