"use client";

import Link from "next/link";
import { DashboardData } from "@/data/dashboard";
import {
    Plus,
    DollarSign,
    Package,
    Tag,
    ShoppingBag,
    ArrowRight,
    TrendingUp,
    Clock,
} from "lucide-react";

interface Props {
    data: DashboardData;
}

export default function DashboardOverview({ data }: Props) {
    const { user, selling, buying } = data;

    return (
        <div className="min-h-screen bg-background font-sans text-foreground">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* --- Header Section --- */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-5">
                        <div className="relative shrink-0">
                            {user?.image ? (
                                <img
                                    src={user.image}
                                    alt={user.name || "User"}
                                    className="w-16 h-16 rounded-full border-2 border-border shadow-sm object-cover"
                                />
                            ) : (
                                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center border-2 border-border shadow-sm">
                                    <span className="text-xl font-bold text-muted-foreground">
                                        {user?.name?.[0]?.toUpperCase() || "U"}
                                    </span>
                                </div>
                            )}
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-primary border-2 border-background rounded-full"></div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Welcome back, {user?.name}
                            </h1>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>
                                    Member since{" "}
                                    {user?.joinedAt
                                        ? new Date(
                                              user.joinedAt
                                          ).toLocaleDateString(undefined, {
                                              month: "long",
                                              year: "numeric",
                                          })
                                        : "2026"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <Link
                        href="/create-item"
                        className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all hover:shadow-md active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        List New Item
                    </Link>
                </div>

                {/* --- SELLING STATS ROW --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <StatCard
                        label="Total Revenue"
                        value={`$${selling.stats.revenue.toLocaleString()}`}
                        sublabel="Lifetime earnings"
                        icon={
                            <DollarSign className="w-5 h-5 text-primary" />
                        }
                        trend="+12% this month" // Placeholder for future data
                    />
                    <StatCard
                        label="Items Sold"
                        value={selling.stats.ordersCount}
                        sublabel="Completed orders"
                        icon={<Package className="w-5 h-5 text-primary" />}
                    />
                    <StatCard
                        label="Active Listings"
                        value={selling.stats.activeListingCount}
                        sublabel="Currently for sale"
                        icon={<Tag className="w-5 h-5 text-accent" />}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* --- LEFT COL: SELLER VIEW --- */}
                    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-card">
                            <h2 className="font-bold text-foreground flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                                Recent Sales
                            </h2>
                        </div>

                        <div className="flex-1 p-0">
                            {selling.recentSales.length === 0 ? (
                                <EmptyState
                                    icon={
                                        <DollarSign className="w-8 h-8 text-muted-foreground/40" />
                                    }
                                    message="No sales yet"
                                    subMessage="Items you sell will appear here."
                                />
                            ) : (
                                <div className="divide-y divide-border">
                                    {selling.recentSales.map((order) => (
                                        <div
                                            key={order.id}
                                            className="p-4 hover:bg-muted transition-colors flex gap-4 items-center group"
                                        >
                                            <div className="w-12 h-12 bg-muted rounded-lg border border-border overflow-hidden shrink-0 relative">
                                                {order.item?.image?.[0] ? (
                                                    <img
                                                        src={
                                                            order.item.image[0]
                                                        }
                                                        className="w-full h-full object-cover"
                                                        alt="Item"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                        <Package className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-900 truncate">
                                                    {order.item?.title ||
                                                        "Unknown Item"}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    Sold to{" "}
                                                    <span className="font-medium text-foreground">
                                                        {order.counterparty
                                                            ?.name || "Someone"}
                                                    </span>
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-primary text-sm">
                                                    +${order.amountPaid}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {new Date(
                                                        order.createdAt
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Active Listings Mini-Section inside Seller Card */}
                        <div className="px-6 py-4 bg-muted border-t border-border">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Active Listings
                                </h3>
                                <Link
                                    href="/my-listings"
                                    className="text-xs font-medium text-primary hover:text-primary/80 hover:underline"
                                >
                                    Manage Listings
                                </Link>
                            </div>
                            {selling.recentListings.length === 0 ? (
                                <p className="text-sm text-slate-400 italic">
                                    No active listings.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {selling.recentListings
                                        .slice(0, 3)
                                        .map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex justify-between items-center text-sm"
                                            >
                                                <span className="text-muted-foreground truncate max-w-[200px]">
                                                    {item.title}
                                                </span>
                                                <span className="font-medium text-foreground">
                                                    ${item.price}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* --- RIGHT COL: BUYER VIEW --- */}
                    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="px-6 py-5 border-b border-border flex justify-between items-center">
                            <h2 className="font-bold text-foreground flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                                My Purchases
                            </h2>
                            <Link
                                href="/history"
                                className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                            >
                                View all <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>

                        <div className="flex-1 p-0">
                            {buying.recentOrders.length === 0 ? (
                                <EmptyState
                                    icon={
                                        <ShoppingBag className="w-8 h-8 text-muted-foreground/40" />
                                    }
                                    message="No purchases yet"
                                    subMessage="Explore the marketplace to find items."
                                />
                            ) : (
                                <div className="divide-y divide-border">
                                    {buying.recentOrders.map((order) => (
                                        <div
                                            key={order.id}
                                            className="p-4 hover:bg-muted transition-colors flex gap-4 items-center"
                                        >
                                            <div className="w-12 h-12 bg-muted rounded-lg border border-border overflow-hidden shrink-0 relative">
                                                {order.item?.image?.[0] ? (
                                                    <img
                                                        src={
                                                            order.item.image[0]
                                                        }
                                                        className="w-full h-full object-cover"
                                                        alt="Item"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                        <ShoppingBag className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-900 truncate">
                                                    {order.item?.title ||
                                                        "Item removed"}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    From{" "}
                                                    <span className="font-medium text-foreground">
                                                        {order.counterparty
                                                            ?.name ||
                                                            "Unknown Seller"}
                                                    </span>
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-primary/10 text-primary mb-1">
                                                    {order.status}
                                                </div>
                                                <p className="text-sm font-medium text-foreground">
                                                    -${order.amountPaid}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Helper Components ---

function StatCard({
    label,
    value,
    sublabel,
    icon,
    trend,
}: {
    label: string;
    value: string | number;
    sublabel: string;
    icon: React.ReactNode;
    trend?: string;
}) {
    return (
        <div className="p-6 bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-muted rounded-lg border border-border">
                    {icon}
                </div>
                {trend && (
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <h3 className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
                    {label}
                </h3>
                <p className="text-3xl font-bold text-foreground mt-1 tracking-tight">
                    {value}
                </p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                    {sublabel}
                </p>
            </div>
        </div>
    );
}

function EmptyState({
    icon,
    message,
    subMessage,
}: {
    icon: React.ReactNode;
    message: string;
    subMessage: string;
}) {
    return (
        <div className="flex flex-col items-center justify-center h-48 text-center p-6">
            <div className="bg-muted p-3 rounded-full mb-3">{icon}</div>
            <p className="text-foreground font-medium text-sm">{message}</p>
            <p className="text-muted-foreground text-xs mt-1">{subMessage}</p>
        </div>
    );
}
