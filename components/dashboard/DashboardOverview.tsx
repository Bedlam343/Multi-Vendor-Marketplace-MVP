"use client";

import Link from "next/link";
import { type DashboardData } from "@/data/dashboard";
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

import PaymentBadge from "@/components/dashboard/PaymentBadge";
import StatCard from "@/components/dashboard/StatCard";
import EmptyState from "@/components/dashboard/EmptyState";

interface Props {
    data: DashboardData;
}

export default function DashboardOverview({ data }: Props) {
    const { user, selling, buying } = data;

    return (
        <div className="min-h-screen bg-background font-sans text-foreground">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* --- Header Section --- */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
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
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
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
                                              user.joinedAt,
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
                        icon={<DollarSign className="w-5 h-5 text-green-500" />}
                    />
                    <StatCard
                        label="Items Sold"
                        value={selling.stats.ordersCount}
                        sublabel="Completed orders"
                        icon={<Package className="w-5 h-5 text-blue-500" />}
                    />
                    <StatCard
                        label="Active Listings"
                        value={selling.stats.activeListingCount}
                        sublabel="Currently for sale"
                        icon={<Tag className="w-5 h-5 text-purple-500" />}
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
                                            className="p-4 hover:bg-muted/50 transition-colors flex gap-4 items-center group"
                                        >
                                            {/* Item Image */}
                                            <div className="w-12 h-12 bg-muted rounded-lg border border-border overflow-hidden shrink-0 relative">
                                                {order.item?.image ? (
                                                    <img
                                                        src={order.item.image}
                                                        className="w-full h-full object-cover"
                                                        alt="Item"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                        <Package className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-foreground truncate">
                                                    {order.item?.title ||
                                                        "Unknown Item"}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className="text-xs text-muted-foreground">
                                                        Sold to{" "}
                                                        <span className="font-medium text-foreground">
                                                            {order.counterparty
                                                                ?.name ||
                                                                "Someone"}
                                                        </span>
                                                    </p>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        •
                                                    </span>
                                                    <PaymentBadge
                                                        payment={order.payment}
                                                    />
                                                </div>
                                            </div>

                                            {/* Amount */}
                                            <div className="text-right">
                                                <p className="font-bold text-green-600 dark:text-green-400 text-sm">
                                                    +$
                                                    {
                                                        order.payment
                                                            .amountPaidUsd
                                                    }
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {new Date(
                                                        order.createdAt,
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Active Listings Mini-Section */}
                        <div className="px-6 py-4 bg-muted/30 border-t border-border">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
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
                                <p className="text-sm text-muted-foreground italic">
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
                                href="/my-purchases"
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
                                            className="p-4 hover:bg-muted/50 transition-colors flex gap-4 items-center"
                                        >
                                            {/* Image */}
                                            <div className="w-12 h-12 bg-muted rounded-lg border border-border overflow-hidden shrink-0 relative">
                                                {order.item?.image ? (
                                                    <img
                                                        src={order.item.image}
                                                        className="w-full h-full object-cover"
                                                        alt="Item"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                        <ShoppingBag className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-foreground truncate">
                                                    {order.item?.title ||
                                                        "Item removed"}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className="text-xs text-muted-foreground">
                                                        From{" "}
                                                        <span className="font-medium text-foreground">
                                                            {order.counterparty
                                                                ?.name ||
                                                                "Unknown"}
                                                        </span>
                                                    </p>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        •
                                                    </span>
                                                    <PaymentBadge
                                                        payment={order.payment}
                                                    />
                                                </div>
                                            </div>

                                            {/* Amount & Status */}
                                            <div className="text-right">
                                                <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-primary/10 text-primary mb-1">
                                                    {order.status}
                                                </div>
                                                <p className="text-sm font-medium text-foreground">
                                                    -$
                                                    {
                                                        order.payment
                                                            .amountPaidUsd
                                                    }
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
