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
                ? "bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm" // Scrolled State (Glass)
                : "bg-transparent border-b border-slate-200/75" // Top State (Invisible/Clean)
        }
      `}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 transition-opacity hover:opacity-90"
                    >
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                            M
                        </div>
                        <span className="text-xl font-bold text-slate-900 tracking-tight hidden sm:block">
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
                        className="hidden sm:flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-full transition-all shadow-sm hover:shadow-md active:scale-95"
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
                                    ? "border-slate-200 hover:bg-slate-50"
                                    : "border-slate-200 bg-white hover:bg-slate-50" // Keep button solid white at top
                            }`}
                        >
                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border border-white shadow-sm">
                                {user.image ? (
                                    <img
                                        src={user.image}
                                        alt="User"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <UserIcon className="w-4 h-4 text-slate-500" />
                                )}
                            </div>
                            <ChevronDown
                                className={`w-3 h-3 text-slate-400 transition-transform ${
                                    isMenuOpen ? "rotate-180" : ""
                                }`}
                            />
                        </button>

                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-2 origin-top-right animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-4 py-2 border-b border-slate-50 mb-1">
                                    <p className="text-sm font-medium text-slate-900 truncate">
                                        {user.name}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate">
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

                                <div className="border-t border-slate-50 mt-1 pt-1">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
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
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
        >
            {icon}
            {children}
        </Link>
    );
}
