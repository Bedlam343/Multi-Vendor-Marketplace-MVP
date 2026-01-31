"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Loader2, ArrowRight, X } from "lucide-react";
import { loginWithDemoUser } from "@/services/demo-actions";

export default function GlobalDemoWidget() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(true); // Default open to catch attention
    const [isLoading, setIsLoading] = useState(false);

    const handleDemoLogin = async () => {
        setIsLoading(true);

        // Add artificial delay so the user sees the "Logging in..." state
        // It makes the transition feel less abrupt/glitchy
        // await new Promise((r) => setTimeout(r, 800));

        const res = await loginWithDemoUser();

        if (res.success) {
            router.refresh();
        } else {
            alert("Demo login failed. Please try again.");
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
                <div className="bg-card border border-border p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 max-w-sm text-center">
                    <div className="p-4 bg-primary/10 rounded-full text-primary relative">
                        <User className="w-8 h-8" />
                        <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 border border-border">
                            <Loader2 className="w-4 h-4 animate-spin text-foreground" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">
                            Setting up Demo Account
                        </h3>
                        <p className="text-muted-foreground text-sm mt-1">
                            Logging you in as a test user...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground p-3 rounded-full shadow-xl hover:scale-110 transition-transform active:scale-95"
                title="Open Demo Login"
            >
                <User className="w-6 h-6" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 w-80 animate-in slide-in-from-bottom-10 duration-500">
            <div className="bg-card border border-primary/20 shadow-2xl rounded-xl overflow-hidden backdrop-blur-md">
                {/* Header */}
                <div className="flex items-center justify-between p-3 bg-primary/10 border-b border-primary/10">
                    <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">
                            Test Mode
                        </span>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4 bg-card/80">
                    <div>
                        <h4 className="font-bold text-foreground text-sm">
                            Exploring the project?
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            Skip the registration. One click gives you full
                            access to chat, buying, and selling features.
                        </p>
                    </div>

                    <button
                        onClick={handleDemoLogin}
                        className="group w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 px-4 rounded-lg text-sm font-bold transition-all active:scale-[0.98] shadow-md"
                    >
                        <span>Login as Demo User</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                </div>
            </div>
        </div>
    );
}
