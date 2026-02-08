"use client";

import { useState, useEffect, useRef } from "react";
import { Send, User, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link"; // Import Link
import { format } from "date-fns";

import { type User as AuthUser } from "better-auth";
import { pusherClient } from "@/lib/pusher-client";
import { markMessagesAsRead, sendMessage } from "@/services/chat/actions";

// Types for props
type Message = {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date;
};

type ChatWindowProps = {
    conversationId: string;
    currentUser: AuthUser;
    otherUser: { name: string | null; image: string | null };
    item: { id: string; title: string; price: string; image: string | null };
    initialMessages: Message[];
};

export default function ChatWindow({
    conversationId,
    currentUser,
    otherUser,
    item,
    initialMessages,
}: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new message
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // mark messages as read on load
    useEffect(() => {
        if (conversationId) {
            markMessagesAsRead(conversationId);
        }
    }, [conversationId]);

    // Real-time Subscription
    useEffect(() => {
        const channelName = `conversation-${conversationId}`;
        const channel = pusherClient.subscribe(channelName);

        channel.bind("new-message", (data: any) => {
            setMessages((prev) => {
                if (prev.find((m) => m.id === data.id)) return prev;
                return [
                    ...prev,
                    { ...data, createdAt: new Date(data.createdAt) },
                ];
            });

            // If the message is from the OTHER user, mark as read immediately
            if (data.senderId !== currentUser.id) {
                markMessagesAsRead(conversationId);
            }
        });

        return () => {
            pusherClient.unsubscribe(channelName);
        };
    }, [conversationId]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        const content = newMessage;
        setNewMessage("");

        const result = await sendMessage({ conversationId, content });

        if (!result?.success) {
            alert("Failed to send");
            setNewMessage(content);
        }

        setIsSending(false);
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-card/50 backdrop-blur-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full bg-muted overflow-hidden border border-border">
                        {otherUser.image ? (
                            <Image
                                src={otherUser.image}
                                alt={otherUser.name || ""}
                                fill
                                sizes="40px"
                                className="object-cover"
                                unoptimized
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <User className="w-5 h-5 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-foreground">
                            {otherUser.name || "User"}
                        </h3>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                            Replying to {/* LINK 1: The Text Link */}
                            <Link
                                href={`/items/${item.id}`}
                                target="_blank"
                                className="font-medium text-foreground hover:text-primary hover:underline transition-colors truncate max-w-[150px] sm:max-w-xs block"
                            >
                                {item.title}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Item Context (Right side) - LINK 2: The entire card is clickable */}
                <Link
                    href={`/items/${item.id}`}
                    target="_blank"
                    className="group flex items-center gap-3 bg-muted/30 p-2 rounded-lg border border-border/50 hover:bg-muted/80 hover:border-primary/20 transition-all cursor-pointer"
                    title="View Item Details"
                >
                    {item.image && (
                        <div className="relative w-8 h-8 rounded bg-background overflow-hidden border border-border/10">
                            <Image
                                src={item.image}
                                alt={item.title}
                                fill
                                sizes="32px"
                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                        </div>
                    )}
                    <div className="hidden sm:block text-right">
                        <p className="text-xs font-bold text-primary">
                            ${item.price}
                        </p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors ml-1" />
                </Link>
            </div>

            {/* Messages List */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
            >
                {messages.map((msg) => {
                    const isMe = msg.senderId === currentUser.id;
                    return (
                        <div
                            key={msg.id}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                                    isMe
                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                        : "bg-card border border-border text-foreground rounded-tl-none"
                                }`}
                            >
                                <p className="leading-relaxed whitespace-pre-wrap">
                                    {msg.content}
                                </p>
                                <p
                                    className={`text-[10px] mt-1 text-right opacity-70 ${
                                        isMe
                                            ? "text-primary-foreground"
                                            : "text-muted-foreground"
                                    }`}
                                >
                                    {format(new Date(msg.createdAt), "h:mm a")}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-card border-t border-border">
                <form onSubmit={handleSend} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className="bg-primary text-primary-foreground px-4 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
