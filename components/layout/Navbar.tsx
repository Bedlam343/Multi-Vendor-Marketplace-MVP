"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
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
} from "lucide-react";

import NavLink from "@/components/ui/NavLink";
import { signOut, useSession } from "@/lib/auth-client";

// --- MAIN NAVBAR SHELL ---
export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const { data: session } = useSession();
    const user = session?.user;
    const pathname = usePathname();

    // Scroll Listener
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            className={`
        sticky top-0 z-50 w-full transition-all duration-300
        ${
            isScrolled
                ? "bg-card/80 backdrop-blur-md border-b border-border shadow-sm"
                : "bg-transparent border-b border-border/75"
        }
      `}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                {/* Left Side: Logo & Main Nav */}
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

                    {/* Navigation Links */}
                    <nav className="hidden md:flex items-center gap-1">
                        <NavLink href="/search" active={pathname === "/search"}>
                            {/* Fix: Wrap content in flex span to ensure alignment */}
                            <span className="flex items-center">
                                <Search className="w-4 h-4 mr-2" />
                                Browse
                            </span>
                        </NavLink>

                        {/* Dashboard is now always visible */}
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

                {/* Right Side: Dynamic Content */}
                <div className="flex items-center gap-4">
                    {user ? <UserActions user={user} /> : <GuestActions />}
                </div>
            </div>
        </header>
    );
}

// --- COMPONENT 1: LOGGED OUT STATE ---
function GuestActions() {
    return (
        <div className="flex items-center gap-3">
            <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
            >
                Log in
            </Link>
            <Link
                href="/signup"
                className="hidden sm:flex bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold px-5 py-2 rounded-full transition-all shadow-sm active:scale-95"
            >
                Sign up
            </Link>
        </div>
    );
}

// --- COMPONENT 2: LOGGED IN STATE ---
function UserActions({ user }: { user: any }) {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleLogout = async () => {
        await signOut();
        router.push("/login");
    };

    // Click Outside Listener
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
        <>
            {/* Sell Button (Desktop) */}
            <Link
                href="/create-item"
                className="hidden sm:flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-primary-foreground text-sm font-medium px-4 py-2 rounded-full transition-all shadow-sm hover:shadow-md active:scale-95"
            >
                <Plus className="w-4 h-4" />
                <span>Sell Item</span>
            </Link>

            {/* User Dropdown */}
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
                        {/* User Details */}
                        <div className="px-4 py-3 border-b border-border mb-2 bg-muted/30">
                            <p className="text-sm font-bold text-foreground truncate">
                                {user.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                {user.email}
                            </p>
                        </div>

                        {/* Mobile-Only Sell Button */}
                        <div className="sm:hidden px-2 mb-2">
                            <Link
                                href="/create-item"
                                className="flex w-full items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-bold px-4 py-2 rounded-lg"
                            >
                                <Plus className="w-4 h-4" /> Sell Item
                            </Link>
                        </div>

                        {/* Menu Items */}
                        <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Buying
                        </div>
                        <DropdownItem
                            href="/my-purchases"
                            icon={<ShoppingBag className="w-4 h-4" />}
                        >
                            My Purchases
                        </DropdownItem>
                        <DropdownItem
                            onClick={() => alert("Coming soon")}
                            icon={<Tag className="w-4 h-4" />}
                        >
                            Saved Items
                        </DropdownItem>

                        <div className="my-2 border-t border-border" />

                        <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Selling
                        </div>
                        <DropdownItem
                            href="/dashboard"
                            icon={<LayoutDashboard className="w-4 h-4" />}
                        >
                            My Sales
                        </DropdownItem>
                        <DropdownItem
                            href="/dashboard/listings"
                            icon={<CreditCard className="w-4 h-4" />}
                        >
                            My Listings
                        </DropdownItem>

                        <div className="my-2 border-t border-border" />

                        <DropdownItem
                            onClick={() => alert("Coming soon")}
                            icon={<Settings className="w-4 h-4" />}
                        >
                            Settings
                        </DropdownItem>

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
        </>
    );
}

// --- HELPER ---
function DropdownItem({
    href,
    icon,
    children,
    onClick,
}: {
    href?: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    onClick?: () => void;
}) {
    return (
        <Link
            href={href || "#"}
            onClick={onClick}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted hover:text-primary transition-colors"
        >
            <span className="text-muted-foreground group-hover:text-primary">
                {icon}
            </span>
            {children}
        </Link>
    );
}
