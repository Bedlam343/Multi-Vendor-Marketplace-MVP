"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type User } from "better-auth";
import {
    LogOut,
    Plus,
    Search,
    LayoutDashboard,
    Settings,
    ChevronDown,
    ShoppingBag,
    Tag,
    CreditCard,
    MessageCircle,
} from "lucide-react";

import { signOut } from "@/lib/auth-client";
import DropdownItemLink from "@/components/ui/DropdownItemLink";
import NavLink from "@/components/ui/NavLink";
import MessageBadge from "@/components/layout/MessagesBadge";

interface NavbarUserProps {
    user: User;
    unreadMessagesCount: number;
}

export default function NavbarUser({
    user,
    unreadMessagesCount,
}: NavbarUserProps) {
    console.log(
        "NavbarUser rendered with unreadMessagesCount:",
        unreadMessagesCount,
    );

    const router = useRouter();
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleLogout = async () => {
        try {
            await signOut();

            // Refresh the current route cache
            router.refresh();

            if (pathname !== "/search") {
                router.replace("/search");
            }
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
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
                        <NavLink
                            href="/dashboard"
                            active={pathname?.startsWith("/dashboard")}
                        >
                            <span className="flex items-center">
                                <LayoutDashboard className="w-4 h-4 mr-2" />
                                Dashboard
                            </span>
                        </NavLink>
                    </nav>
                </div>

                {/* Right Side: USER ACTIONS */}
                <div className="flex items-center gap-4">
                    <MessageBadge
                        initialCount={unreadMessagesCount}
                        userId={user.id}
                    />

                    {/* --- SELL BUTTON (Primary CTA) --- */}
                    <Link
                        href="/create-item"
                        className="hidden sm:flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-primary-foreground text-sm font-medium px-4 py-2 rounded-full transition-all shadow-sm hover:shadow-md active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Sell Item</span>
                    </Link>

                    {/* --- USER DROPDOWN --- */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="flex items-center gap-2 p-1 pr-2 rounded-full border border-border bg-card hover:bg-muted transition-colors"
                        >
                            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center overflow-hidden border border-border shadow-sm">
                                {user.image ? (
                                    <img
                                        src={user.image}
                                        alt={user.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="font-bold text-xs text-muted-foreground">
                                        {user.name?.[0]}
                                    </span>
                                )}
                            </div>
                            <ChevronDown
                                className={`w-3 h-3 text-muted-foreground transition-transform ${
                                    isMenuOpen ? "rotate-180" : ""
                                }`}
                            />
                        </button>

                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-popover rounded-xl shadow-lg border border-border py-2 origin-top-right animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-4 py-3 border-b border-border mb-2 bg-muted/30">
                                    <p className="text-sm font-bold text-foreground truncate">
                                        {user.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {user.email}
                                    </p>
                                </div>

                                {/* Mobile-Only Actions */}
                                <div className="sm:hidden px-2 mb-2 space-y-1">
                                    <Link
                                        href="/create-item"
                                        className="flex w-full items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-bold px-4 py-2 rounded-lg"
                                    >
                                        <Plus className="w-4 h-4" /> Sell Item
                                    </Link>
                                </div>

                                <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Buying
                                </div>
                                <DropdownItemLink
                                    href="/my-purchases"
                                    icon={<ShoppingBag className="w-4 h-4" />}
                                >
                                    My Purchases
                                </DropdownItemLink>

                                {/* Mobile Messages Link (Keep it here for mobile users) */}
                                <div className="sm:hidden">
                                    <DropdownItemLink
                                        href="/messages"
                                        icon={
                                            <MessageCircle className="w-4 h-4" />
                                        }
                                    >
                                        Messages
                                    </DropdownItemLink>
                                </div>

                                <DropdownItemLink
                                    onClick={() =>
                                        alert(
                                            "Saved items feature coming soon!",
                                        )
                                    }
                                    icon={<Tag className="w-4 h-4" />}
                                >
                                    Saved Items
                                </DropdownItemLink>

                                <div className="my-2 border-t border-border" />

                                <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Selling
                                </div>
                                <DropdownItemLink
                                    href="/dashboard"
                                    icon={
                                        <LayoutDashboard className="w-4 h-4" />
                                    }
                                >
                                    My Sales
                                </DropdownItemLink>
                                <DropdownItemLink
                                    href="/dashboard/listings"
                                    icon={<CreditCard className="w-4 h-4" />}
                                >
                                    My Listings
                                </DropdownItemLink>

                                <div className="my-2 border-t border-border" />

                                <DropdownItemLink
                                    onClick={() =>
                                        alert("Settings coming soon!")
                                    }
                                    icon={<Settings className="w-4 h-4" />}
                                >
                                    Settings
                                </DropdownItemLink>

                                <div className="border-t border-border mt-1 pt-1">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors font-medium"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
