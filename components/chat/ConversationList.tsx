"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { User } from "lucide-react";

import { pusherClient } from "@/lib/pusher-client";
import { type ConversationSnippets } from "@/services/chat/queries";

export default function ConversationList({
    conversations: initialConversations,
    userId,
}: {
    conversations: ConversationSnippets;
    userId: string;
}) {
    const pathname = usePathname();
    const [conversations, setConversations] = useState(initialConversations);

    // Sync if server props change (e.g. navigation)
    useEffect(() => {
        setConversations(initialConversations);
    }, [initialConversations]);

    useEffect(() => {
        if (!userId) return;

        const channelName = `user-${userId}`;
        const channel = pusherClient.subscribe(channelName);

        // handle new messages (Move to top + Unread Dot)
        const handleNewMessage = (data: {
            conversationId: string;
            lastMessage: string;
            updatedAt: string;
        }) => {
            setConversations((prev) => {
                const existingIndex = prev.findIndex(
                    (c) => c.id === data.conversationId,
                );

                // If it's a new conversation we don't have yet, we'd need a full fetch.
                // For MVP, we can just ignore or try to patch it if we have the data.
                // Assuming for 'inbox-update' we just update existing ones:

                if (existingIndex === -1) return prev; // Or trigger a re-fetch

                const updatedConv = {
                    ...prev[existingIndex],
                    lastMessage: data.lastMessage,
                    updatedAt: new Date(data.updatedAt),
                    hasUnread: true,
                };

                // Remove old entry and add new one to top
                const newList = [...prev];
                newList.splice(existingIndex, 1);
                return [updatedConv, ...newList];
            });
        };

        // handle read receipts (Remove Dot)
        const handleRead = (data: { conversationId: string }) => {
            setConversations((prev) =>
                prev.map((c) =>
                    c.id === data.conversationId
                        ? { ...c, hasUnread: false }
                        : c,
                ),
            );
        };

        // Bind events
        channel.bind("inbox-update", handleNewMessage);
        channel.bind("conversation-read", handleRead);

        // add new new message to the top of the conversation list
        // if new message sent from another user while we're on the page
        channel.bind("new-message", (data: any) => {
            setConversations((prev) => {
                // Avoid duplicates if we somehow get double-tapped
                if (prev.find((c) => c.id === data.conversationId)) return prev;

                const newConversation = {
                    id: data.conversationId,
                    updatedAt: new Date(data.timestamp),
                    lastMessage: data.content,
                    hasUnread: true, // It's brand new, so it's unread

                    // Construct the objects from the flat payload
                    otherUser: {
                        id: data.senderId,
                        name: data.senderName,
                        image: data.senderImage,
                    },
                    item: {
                        id: data.itemId,
                        title: data.itemTitle,
                        price: data.itemPrice,
                        image: data.itemImage,
                    },
                };

                // Add to the VERY TOP of the list
                return [newConversation, ...prev];
            });
        });

        return () => {
            pusherClient.unsubscribe(channelName);
        };
    }, [userId]);

    if (conversations.length === 0) {
        return (
            <div className="p-4 text-center text-muted-foreground text-sm mt-10">
                No messages yet.
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            {conversations.map((conv) => {
                const isActive = pathname === `/messages/${conv.id}`;

                return (
                    <Link
                        key={conv.id}
                        href={`/messages/${conv.id}`}
                        className={`
              group relative flex items-start gap-3 p-4 transition-all border-b border-border/50
              ${
                  isActive
                      ? "bg-primary/5 border-l-4 border-l-primary"
                      : "hover:bg-muted/50 border-l-4 border-l-transparent"
              }
            `}
                    >
                        {/* User Avatar */}
                        <div className="relative shrink-0">
                            <div className="w-10 h-10 rounded-full bg-muted overflow-hidden border border-border relative">
                                {conv.otherUser.image ? (
                                    <Image
                                        src={conv.otherUser.image}
                                        alt={conv.otherUser.name || "User"}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                        <User className="w-5 h-5" />
                                    </div>
                                )}
                            </div>

                            {/* Item Mini Badge */}
                            {conv.item.image && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md border border-background bg-muted overflow-hidden shadow-sm">
                                    <Image
                                        src={conv.item.image}
                                        alt="item"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-0.5">
                                <h3
                                    className={`text-sm font-bold truncate ${
                                        isActive
                                            ? "text-primary"
                                            : "text-foreground"
                                    }`}
                                >
                                    {conv.otherUser.name || "Anonymous"}
                                </h3>
                                <span className="text-[10px] text-muted-foreground shrink-0">
                                    {formatDistanceToNow(
                                        new Date(conv.updatedAt),
                                        {
                                            addSuffix: false,
                                        },
                                    )}
                                </span>
                            </div>

                            <p className="text-xs text-muted-foreground truncate mb-1">
                                {conv.item.title} • ${conv.item.price}
                            </p>

                            <div className="flex items-center justify-between">
                                <p
                                    className={`text-xs truncate font-medium ${conv.hasUnread ? "text-foreground font-bold" : "text-foreground/80"}`}
                                >
                                    {conv.lastMessage}
                                </p>

                                {/* THE UNREAD DOT */}
                                {conv.hasUnread && (
                                    <span className="w-2.5 h-2.5 bg-primary rounded-full shrink-0 ml-2 animate-pulse" />
                                )}
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
