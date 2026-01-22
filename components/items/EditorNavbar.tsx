"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, X } from "lucide-react";

export default function EditorNavbar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isSuccess = searchParams.get("status") === "success";

    const handleExit = (e: React.MouseEvent) => {
        e.preventDefault();

        // If we are in success state, just go. No warning needed.
        if (isSuccess) {
            router.push("/dashboard");
            return;
        }

        // Otherwise, warn the user.
        const confirmed = window.confirm(
            "Are you sure you want to leave? Your draft will be lost.",
        );

        if (confirmed) {
            router.push("/dashboard");
        }
    };

    return (
        <nav className="h-16 border-b bg-card/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-3xl mx-auto px-4 h-full grid grid-cols-3 items-center">
                {/* Left: Logo */}
                <div className="flex justify-start">
                    <a
                        href="/dashboard"
                        onClick={handleExit}
                        className="flex items-center gap-2 transition-opacity hover:opacity-80"
                    >
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm">
                            M
                        </div>
                        <span className="text-xl font-bold text-foreground tracking-tight hidden sm:block">
                            Marketplace
                        </span>
                    </a>
                </div>

                {/* Center: Context */}
                <div className="flex justify-center items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-foreground tracking-tight">
                        Create Item
                    </span>
                </div>

                {/* Right: Close */}
                <div className="flex justify-end items-center gap-4">
                    <button
                        onClick={handleExit}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
                        title="Exit Editor"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </nav>
    );
}
