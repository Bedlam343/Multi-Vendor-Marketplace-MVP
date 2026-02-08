"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { pusherClient } from "@/lib/pusher-client";

interface MessageBadgeProps {
    initialCount: number;
    userId: string;
}

export default function MessageBadge({
    initialCount,
    userId,
}: MessageBadgeProps) {
    const pathname = usePathname();
    const [unreadCount, setUnreadCount] = useState(initialCount);

    // Sync state if server prop changes (e.g. on navigation/revalidation)
    useEffect(() => {
        setUnreadCount(initialCount);
    }, [initialCount]);

    useEffect(() => {
        if (!userId) return;

        const channelName = `user-${userId}`;
        const channel = pusherClient.subscribe(channelName);

        // Listen for new messages causing an inbox update
        channel.bind("inbox-update", () => {
            setUnreadCount((prev) => prev + 1);
        });

        // Future: Listen for 'messages-read' event to decrement

        return () => {
            pusherClient.unsubscribe(channelName);
        };
    }, [userId]);

    const isActive = pathname?.startsWith("/messages");

    return (
        <Link
            href="/messages"
            className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full transition-all font-medium text-sm relative ${
                isActive
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
        >
            <div className="relative">
                <MessageCircle className="w-4 h-4" />
                {unreadCount > 0 && (
                    <span
                        className="absolute -top-1.5 -right-1.5 
                        min-w-[17px] h-[17px] flex items-center 
                        justify-center bg-primary text-[10px] 
                        text-primary-foreground font-bold rounded-full 
                        px-0.5 border-2 border-background"
                    >
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </div>
            <span>Messages</span>
        </Link>
    );
}
