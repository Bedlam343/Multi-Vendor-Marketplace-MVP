"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LogOut,
    Plus,
    Search,
    LayoutDashboard,
    User as UserIcon,
    Settings,
    ChevronDown,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const user = { name: "Jagjit Singh", image: null };

    const handleLogout = async () => {
        await authClient.signOut();
        router.push("/login");
    };

    // 1. Scroll Listener
    useEffect(() => {
        const handleScroll = () => {
            // Toggle state if we've scrolled more than 10px
            setIsScrolled(window.scrollY > 10);
        };

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
            className={`
        sticky top-0 z-50 w-full transition-all duration-300
        ${
            isScrolled
                ? "bg-card/80 backdrop-blur-md border-b border-border shadow-sm" // Scrolled State (Glass)
                : "bg-transparent border-b border-border/75" // Top State (Invisible/Clean)
        }
      `}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
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
                            <Search className="w-4 h-4 mr-2" />
                            Browse
                        </NavLink>
                        <NavLink
                            href="/dashboard"
                            active={pathname === "/dashboard"}
                        >
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            Dashboard
                        </NavLink>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <Link
                        href="/create-item"
                        className="hidden sm:flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-primary-foreground text-sm font-medium px-4 py-2 rounded-full transition-all shadow-sm hover:shadow-md active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Sell Item</span>
                    </Link>

                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            // 3. Update button background to match the cleaner header
                            className={`flex items-center gap-2 p-1 pr-2 rounded-full border transition-colors ${
                                isScrolled
                                    ? "border-border hover:bg-muted"
                                    : "border-border bg-card hover:bg-muted" // Keep button solid white at top
                            }`}
                        >
                            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center overflow-hidden border border-border shadow-sm">
                                {user.image ? (
                                    <img
                                        src={user.image}
                                        alt="User"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <UserIcon className="w-4 h-4 text-muted-foreground" />
                                )}
                            </div>
                            <ChevronDown
                                className={`w-3 h-3 text-muted-foreground transition-transform ${
                                    isMenuOpen ? "rotate-180" : ""
                                }`}
                            />
                        </button>

                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-popover rounded-xl shadow-lg border border-border py-2 origin-top-right animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-4 py-2 border-b border-border mb-1">
                                    <p className="text-sm font-medium text-foreground truncate">
                                        {user.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        user@example.com
                                    </p>
                                </div>

                                <DropdownItem
                                    href="/profile"
                                    icon={<UserIcon className="w-4 h-4" />}
                                >
                                    My Profile
                                </DropdownItem>
                                <DropdownItem
                                    href="/settings"
                                    icon={<Settings className="w-4 h-4" />}
                                >
                                    Settings
                                </DropdownItem>

                                <div className="border-t border-border mt-1 pt-1">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
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

// helper components
function NavLink({
    href,
    active,
    children,
}: {
    href: string;
    active: boolean;
    children: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className={`
        flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all
        ${
            active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }
      `}
        >
            {children}
        </Link>
    );
}

function DropdownItem({
    href,
    icon,
    children,
}: {
    href: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted hover:text-primary transition-colors"
        >
            {icon}
            {children}
        </Link>
    );
}
