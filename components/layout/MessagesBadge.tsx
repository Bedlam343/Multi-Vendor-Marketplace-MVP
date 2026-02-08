"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { pusherClient } from "@/lib/pusher-client";

interface NavbarMessagesBadgeProps {
    initialCount: number;
    userId: string;
}

export default function NavbarMessagesBadge({
    initialCount,
    userId,
}: NavbarMessagesBadgeProps) {
    console.log("Initial Unread Count in NavbarMessagesBadge:", initialCount);
    const pathname = usePathname();
    const [unreadCount, setUnreadCount] = useState(initialCount);

    // Sync state if server prop changes (e.g. on navigation)
    useEffect(() => {
        setUnreadCount(initialCount);
    }, [initialCount]);

    useEffect(() => {
        if (!userId) return;

        const channelName = `user-${userId}`;
        const channel = pusherClient.subscribe(channelName);

        // Listen for the specific "unread-update" event
        // Payload structure: { count: number }
        channel.bind("unread-update", (data: { count: number }) => {
            console.log("Received unread-update event:", data);
            setUnreadCount(data.count);
        });

        return () => {
            pusherClient.unsubscribe(channelName);
        };
    }, [userId]);

    const isActive = pathname?.startsWith("/messages");

    return (
        <Link
            href="/messages"
            className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full transition-all font-medium text-sm relative group ${
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
