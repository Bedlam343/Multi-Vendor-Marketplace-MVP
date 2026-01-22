"use client";

import { useRouter } from "next/navigation";
import { Sparkles, FileText, X } from "lucide-react";

export default function EditorNavbar() {
    const router = useRouter();

    const handleExit = (e: React.MouseEvent) => {
        e.preventDefault(); // Stop instant navigation

        // Native browser confirm dialog (Simple & Robust)
        const confirmed = window.confirm(
            "Are you sure you want to leave? Your draft will be lost.",
        );

        if (confirmed) {
            router.push("/dashboard");
        }
    };

    return (
        <nav className="h-16 border-b bg-card/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-5xl mx-auto px-4 h-full grid grid-cols-3 items-center">
                {/* Left: Logo (Acts as Exit Button) */}
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
                    {/* <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                        <Sparkles className="w-4 h-4" />
                    </div> */}
                    <span className="font-bold text-foreground tracking-tight">
                        Create Item
                    </span>
                </div>

                {/* Right: Draft Status & Close */}
                <div className="flex justify-end items-center gap-4">
                    {/* <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md border border-border">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Draft</span>
                    </div> */}

                    {/* Explicit Close Button for clarity */}
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
