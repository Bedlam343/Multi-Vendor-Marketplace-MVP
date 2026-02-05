import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq, asc } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import ChatWindow from "@/components/chat/ChatWindow";

export default async function ConversationPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) redirect("/login");

    // 1. Fetch Conversation & Participants & Item
    const conversation = await db.query.conversations.findFirst({
        where: eq(conversations.id, id),
        with: {
            item: true,
            participantOne: true,
            participantTwo: true,
        },
    });

    if (!conversation) return notFound();

    // 2. Security Check
    const isP1 = conversation.participantOneId === session.user.id;
    const isP2 = conversation.participantTwoId === session.user.id;

    if (!isP1 && !isP2) return notFound();

    // 3. Determine "Other User"
    const otherUser = isP1
        ? conversation.participantTwo
        : conversation.participantOne;

    // 4. Fetch Messages
    const messageHistory = await db.query.messages.findMany({
        where: eq(messages.conversationId, id),
        orderBy: [asc(messages.createdAt)],
    });

    return (
        <ChatWindow
            conversationId={id}
            currentUser={session.user}
            otherUser={{
                name: otherUser.name,
                image: otherUser.image,
            }}
            item={{
                id: conversation.item.id,
                title: conversation.item.title,
                price: conversation.item.price,
                image: conversation.item.images?.[0] || null,
            }}
            initialMessages={messageHistory}
        />
    );
}
