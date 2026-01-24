"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
    LogOut,
    Plus,
    Search,
    LayoutDashboard,
    User as UserIcon,
    Settings,
    ChevronDown,
    ShoppingBag,
    Tag,
    CreditCard,
} from "lucide-react";

import NavLink from "@/components/ui/NavLink";
import { signOut, useSession } from "@/lib/auth-client";

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const { data: session } = useSession();

    const user = session?.user;

    const handleLogout = async () => {
        await signOut();
        router.push("/login");
    };

    // Scroll Listener
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

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
                            className={`flex items-center gap-2 p-1 pr-2 rounded-full border transition-colors ${
                                isScrolled
                                    ? "border-border hover:bg-muted"
                                    : "border-border bg-card hover:bg-muted"
                            }`}
                        >
                            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center overflow-hidden border border-border shadow-sm">
                                {user?.image ? (
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
                            <div className="absolute right-0 mt-2 w-64 bg-popover rounded-xl shadow-lg border border-border py-2 origin-top-right animate-in fade-in zoom-in-95 duration-200">
                                {/* User Info */}
                                <div className="px-4 py-3 border-b border-border mb-2 bg-muted/30">
                                    <p className="text-sm font-bold text-foreground truncate">
                                        {user?.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {user?.email}
                                    </p>
                                </div>

                                {/* BUYING SECTION */}
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
                                    onClick={() =>
                                        window.alert(
                                            "Save Items feature coming soon!",
                                        )
                                    }
                                    icon={<Tag className="w-4 h-4" />}
                                >
                                    Saved Items
                                </DropdownItem>

                                <div className="my-2 border-t border-border" />

                                {/* SELLING SECTION */}
                                <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Selling
                                </div>
                                <DropdownItem
                                    href="/dashboard"
                                    icon={
                                        <LayoutDashboard className="w-4 h-4" />
                                    }
                                >
                                    My Sales (Dashboard)
                                </DropdownItem>
                                <DropdownItem
                                    href="/my-listings"
                                    icon={<CreditCard className="w-4 h-4" />}
                                >
                                    My Listings
                                </DropdownItem>

                                <div className="my-2 border-t border-border" />

                                {/* ACCOUNT SECTION */}
                                <DropdownItem
                                    onClick={() =>
                                        window.alert(
                                            "Settings page coming soon!",
                                        )
                                    }
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
                </div>
            </div>
        </header>
    );
}

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
