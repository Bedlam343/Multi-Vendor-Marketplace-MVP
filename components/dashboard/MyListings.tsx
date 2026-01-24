"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Edit, Clock, PackageX } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useDebouncedCallback } from "use-debounce";

import { getItemsAction } from "@/services/items-queries";
import { type ItemWithSeller } from "@/data/items";

interface MyListingsClientProps {
    initialItems: ItemWithSeller[];
    initialPagination: { currentPage: number; pages: number; total: number };
    userId: string;
}

type TabValue = "all" | "available" | "sold" | "reserved";

export default function MyListingsClient({
    initialItems,
    initialPagination,
    userId,
}: MyListingsClientProps) {
    const [items, setItems] = useState(initialItems);
    const [page, setPage] = useState(initialPagination.currentPage);
    const [hasMore, setHasMore] = useState(
        initialPagination.currentPage < initialPagination.pages,
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<TabValue>("all");
    const [isPending, startTransition] = useTransition();

    // --- CORE DATA FETCHING ---
    const refreshData = async (newQuery: string, newTab: TabValue) => {
        startTransition(async () => {
            const filters: any = {
                sellerId: userId,
                page: 1,
                limit: 12,
            };

            if (newQuery) filters.search = newQuery;
            if (newTab !== "all") filters.status = newTab;

            const res = await getItemsAction(filters);

            if (res.success && res.result) {
                setItems(res.result.data);
                setPage(1);
                setHasMore(
                    res.result.pagination.currentPage <
                        res.result.pagination.pages,
                );
            }
        });
    };

    // --- DEBOUNCED SEARCH ---
    const debouncedSearch = useDebouncedCallback((value: string) => {
        refreshData(value, activeTab);
    }, 300);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchQuery(val);
        debouncedSearch(val);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            debouncedSearch.cancel();
            refreshData(searchQuery, activeTab);
        }
    };

    const handleTabChange = (tab: TabValue) => {
        setActiveTab(tab);
        refreshData(searchQuery, tab);
    };

    const loadMore = async () => {
        const nextPage = page + 1;
        const filters: any = {
            sellerId: userId,
            page: nextPage,
            limit: 12,
        };

        if (searchQuery) filters.search = searchQuery;
        if (activeTab !== "all") filters.status = activeTab;

        const res = await getItemsAction(filters);

        if (res.success && res.result) {
            setItems((prev) => [...prev, ...res.result!.data]);
            setPage(res.result.pagination.currentPage);
            setHasMore(
                res.result.pagination.currentPage < res.result.pagination.pages,
            );
        }
    };

    // --- RENDER HELPERS ---

    const getStatusBadge = (status: string) => {
        // UPDATED STYLES FOR VISIBILITY
        // Using solid backgrounds or high-contrast styles for overlay badges
        const styles = {
            available:
                "bg-emerald-500/90 text-white shadow-sm border-emerald-600/20",
            sold: "bg-zinc-800/90 text-zinc-100 shadow-sm border-zinc-700/50",
            reserved:
                "bg-orange-500/90 text-white shadow-sm border-orange-600/20",
        };
        const style = styles[status as keyof typeof styles] || styles.available;

        return (
            <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm border ${style}`}
            >
                {status}
            </span>
        );
    };

    return (
        <div className="space-y-8">
            {/* Controls: Search & Tabs */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                {/* Tabs */}
                <div className="flex p-1 bg-muted/50 rounded-xl border border-border overflow-x-auto shrink-0 no-scrollbar">
                    {(["all", "available", "sold", "reserved"] as const).map(
                        (tab) => (
                            <button
                                key={tab}
                                onClick={() => handleTabChange(tab)}
                                disabled={isPending}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize whitespace-nowrap ${
                                    activeTab === tab
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                }`}
                            >
                                {tab === "all" ? "All Listings" : tab}
                            </button>
                        ),
                    )}
                </div>

                {/* Search */}
                <div className="relative w-full md:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search title..."
                        value={searchQuery}
                        onChange={handleSearch}
                        onKeyDown={handleKeyDown}
                        className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                    />
                </div>
            </div>

            {/* Loading State Overlay */}
            <div
                className={`relative min-h-[400px] transition-opacity duration-300 ${
                    isPending ? "opacity-50 pointer-events-none" : "opacity-100"
                }`}
            >
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-2xl bg-card/50">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <PackageX className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">
                            No listings found
                        </h3>
                        <p className="text-muted-foreground max-w-xs mt-1">
                            {searchQuery
                                ? `No items match "${searchQuery}"`
                                : "You don't have any items in this category."}
                        </p>
                        {activeTab !== "all" && (
                            <button
                                onClick={() => handleTabChange("all")}
                                className="mt-4 text-primary font-bold text-sm hover:underline"
                            >
                                View all items
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {items.map((item) => (
                            <Link
                                key={item.id}
                                href={`/items/${item.id}`}
                                className="group block bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                            >
                                {/* Image Area */}
                                <div className="relative aspect-[4/3] bg-muted/20 border-b border-border">
                                    {item.images && item.images.length > 0 ? (
                                        <Image
                                            src={item.images[0]}
                                            alt={item.title}
                                            fill
                                            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${
                                                item.status === "sold"
                                                    ? "grayscale opacity-75"
                                                    : ""
                                            }`}
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                            <span className="text-xs font-medium">
                                                No Image
                                            </span>
                                        </div>
                                    )}

                                    {/* High Visibility Status Badge */}
                                    <div className="absolute top-3 left-3 z-10">
                                        {getStatusBadge(item.status)}
                                    </div>
                                </div>

                                {/* Content Area */}
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                            {item.title}
                                        </h3>
                                    </div>

                                    <div className="flex items-center gap-1 text-lg font-black text-foreground mb-4">
                                        <span className="text-xs text-muted-foreground font-normal align-top mt-1">
                                            $
                                        </span>
                                        {Number(item.price).toLocaleString()}
                                    </div>

                                    <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-medium">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {formatDistanceToNow(
                                                new Date(item.createdAt),
                                                {
                                                    addSuffix: true,
                                                },
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button className="hover:text-foreground flex items-center gap-1 transition-colors">
                                                <Edit className="w-3.5 h-3.5" />
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Load More Button */}
                {hasMore && items.length > 0 && (
                    <div className="mt-12 flex justify-center">
                        <button
                            onClick={loadMore}
                            className="px-8 py-3 bg-secondary border border-border shadow-sm text-foreground font-medium rounded-full hover:bg-muted hover:shadow-md transition-all active:scale-95"
                        >
                            Load More
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
