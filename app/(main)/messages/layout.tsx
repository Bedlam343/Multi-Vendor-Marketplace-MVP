import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

import { getUserConversations } from "@/services/chat/queries";
import ConversationList from "@/components/chat/ConversationList";

export default async function MessagesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) redirect("/login");

    // fetch the list once
    const conversations = await getUserConversations(session.user.id);

    return (
        <div className="max-w-6xl mx-auto h-[calc(100vh-64px)] flex bg-background">
            <div className="w-full md:w-80 lg:w-96 border-r border-border flex flex-col bg-card shrink-0">
                <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10 h-16">
                    <h1 className="font-bold text-xl tracking-tight">
                        Messages
                    </h1>
                    {/* <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
                        {conversations.length}
                    </span> */}
                </div>

                {/* The List Component */}
                <ConversationList
                    conversations={conversations}
                    userId={session.user.id}
                />
            </div>

            <div className="hidden md:flex flex-1 flex-col bg-muted/5 relative overflow-hidden">
                {children}
            </div>
        </div>
    );
}
