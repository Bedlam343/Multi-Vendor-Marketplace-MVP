"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { User } from "lucide-react";

import { type ConversationSnippets } from "@/services/chat/queries";

export default function ConversationList({
    conversations,
}: {
    conversations: ConversationSnippets;
}) {
    const pathname = usePathname();

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
                            <div
                                className="w-10 h-10 rounded-full bg-muted overflow-hidden 
                                border border-border relative"
                            >
                                {conv.otherUser.image ? (
                                    <Image
                                        src={conv.otherUser.image}
                                        alt={conv.otherUser.name || "User"}
                                        fill
                                        sizes="40px"
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
                                        sizes="20px"
                                        className="object-cover"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-0.5">
                                <h3
                                    className={`text-sm font-bold truncate ${isActive ? "text-primary" : "text-foreground"}`}
                                >
                                    {conv.otherUser.name || "Anonymous"}
                                </h3>
                                <span className="text-[10px] text-muted-foreground shrink-0">
                                    {formatDistanceToNow(
                                        new Date(conv.updatedAt),
                                        { addSuffix: false },
                                    )}
                                </span>
                            </div>

                            <p className="text-xs text-muted-foreground truncate mb-1">
                                {conv.item.title} • ${conv.item.price}
                            </p>

                            <p className="text-xs text-foreground/80 truncate font-medium">
                                {conv.lastMessage}
                            </p>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
