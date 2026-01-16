"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export default function Modal({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            router.back();
        }, 200);
    };

    return (
        <div 
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop */}
            <div 
                className={`absolute inset-0 bg-black/35 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
                onClick={handleClose}
            />

            {/* Modal Content Wrapper */}
            <div 
                className={`relative w-full max-w-5xl bg-card rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 transform ${isClosing ? 'scale-95 translate-y-4' : 'scale-100 translate-y-0'}`}
            >
                {/* Close Button */}
                <button 
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-card/80 backdrop-blur-md rounded-full text-muted-foreground hover:text-foreground hover:bg-card shadow-sm transition-all"
                >
                    <X className="w-5 h-5" />
                </button>
                
                {children}
            </div>
        </div>
    );
}
