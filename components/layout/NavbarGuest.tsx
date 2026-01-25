"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import NavLink from "@/components/ui/NavLink"; // Assuming you have this shared component

export default function NavbarGuest() {
    const [isScrolled, setIsScrolled] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            className={`sticky top-0 z-50 w-full transition-all duration-300 ${
                isScrolled
                    ? "bg-card/80 backdrop-blur-md border-b border-border shadow-sm"
                    : "bg-transparent border-b border-border/75"
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                {/* Left Side */}
                <div className="flex items-center gap-8">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 transition-opacity hover:opacity-90"
                    >
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm">
                            M
                        </div>
                        <span className="text-xl font-bold text-foreground tracking-tight hidden sm:block">
                            Marketplace
                        </span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-1">
                        <NavLink href="/search" active={pathname === "/search"}>
                            <span className="flex items-center">
                                <Search className="w-4 h-4 mr-2" />
                                Browse
                            </span>
                        </NavLink>
                    </nav>
                </div>

                {/* Right Side: GUEST ACTIONS */}
                <div className="flex items-center gap-3">
                    <Link
                        href="/login"
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
                    >
                        Log in
                    </Link>
                    <Link
                        href="/signup"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold px-5 py-2 rounded-full transition-all shadow-sm active:scale-95"
                    >
                        Sign up
                    </Link>
                </div>
            </div>
        </header>
    );
}
