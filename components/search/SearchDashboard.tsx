"use client";

import { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Search, Filter, X } from "lucide-react";

import Filters from "@/components/search/Filters";
import { type ItemWithSeller } from "@/data/items";
import { getItemsAction } from "@/services/items-queries";
import { type ItemFilters } from "@/db/validation";

function ItemCard({ item }: { item: ItemWithSeller }) {
    return (
        <Link href={`/items/${item.id}`} className="group block h-full">
            <article className="h-full flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                {/* Image Container */}
                <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    {item.images && item.images.length > 0 ? (
                        <Image
                            src={item.images[0]}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            unoptimized
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-400">
                            <span className="text-sm">No Preview</span>
                        </div>
                    )}
                    {/* Badge: Price */}
                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-slate-900 px-2.5 py-1 rounded-full text-sm font-bold shadow-sm border border-slate-100/50">
                        ${item.price.toLocaleString()}
                    </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex flex-col flex-1">
                    <div className="flex justify-between items-start gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900 text-lg leading-tight truncate">
                            {item.title}
                        </h3>
                    </div>

                    {/* Condition Badge */}
                    <div className="mb-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 capitalize">
                            {item.condition?.replace("-", " ")}
                        </span>
                    </div>

                    {/* Footer: Seller & Time */}
                    <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-slate-200 overflow-hidden relative border border-slate-100">
                                {item.seller?.image ? (
                                    <Image
                                        src={item.seller.image}
                                        alt={item.seller.name || ""}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-[10px]">
                                        {item.seller?.name?.[0] || "?"}
                                    </div>
                                )}
                            </div>
                            <span className="truncate max-w-[100px] font-medium text-slate-700">
                                {item.seller?.name || "Anonymous"}
                            </span>
                        </div>
                        <span>
                            {formatDistanceToNow(new Date(item.createdAt))} ago
                        </span>
                    </div>
                </div>
            </article>
        </Link>
    );
}

// --- MAIN COMPONENT: Search Dashboard ---
interface DashboardProps {
    initialData: ItemWithSeller[];
    initialPagination: { currentPage: number; pages: number; total: number };
    initialFilters: ItemFilters;
}

export function SearchDashboard({
    initialData,
    initialPagination,
    initialFilters,
}: DashboardProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [items, setItems] = useState<ItemWithSeller[]>(initialData);
    const [page, setPage] = useState(initialPagination.currentPage);
    const [hasMore, setHasMore] = useState(page < initialPagination.pages);
    const [isPending, startTransition] = useTransition();
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    // Sync state if initialData changes (e.g. user refreshed or navigated back)
    useEffect(() => {
        const resetState = () => {
            setItems(initialData);
            setPage(initialPagination.currentPage);
            setHasMore(initialPagination.currentPage < initialPagination.pages);
        };

        resetState();
    }, [initialData, initialPagination]);

    const handleFilterChange = (key: string, value?: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set(key, value);
        else params.delete(key);

        params.set("page", "1");

        startTransition(() => {
            router.replace(`/search?${params.toString()}`);
        });
    };

    const handleReset = () => {
        const params = new URLSearchParams(searchParams.toString());

        // Explicitly delete all filter keys
        ["search", "minPrice", "maxPrice", "condition"].forEach((key) => {
            params.delete(key);
        });

        params.set("page", "1");

        startTransition(() => {
            router.replace(`/search?${params.toString()}`);
        });
    };

    const loadMore = async () => {
        const nextPage = page + 1;
        const res = await getItemsAction({ ...initialFilters, page: nextPage });

        if (res.success && res.result) {
            setItems((prev) => [...prev, ...res.result!.data]);
            setPage(res.result!.pagination.currentPage);
            setHasMore(
                res.result!.pagination.currentPage <
                    res.result!.pagination.pages
            );
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Mobile Filter Toggle */}
                    <div className="lg:hidden mb-4">
                        <button
                            onClick={() =>
                                setMobileFiltersOpen(!mobileFiltersOpen)
                            }
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-sm font-medium text-slate-700 w-full justify-center"
                        >
                            {mobileFiltersOpen ? (
                                <X className="w-4 h-4" />
                            ) : (
                                <Filter className="w-4 h-4" />
                            )}
                            {mobileFiltersOpen
                                ? "Close Filters"
                                : "Filters & Sort"}
                        </button>
                    </div>

                    {/* Sidebar (Desktop + Mobile State) */}
                    <aside
                        className={`
            lg:w-64 flex-shrink-0 
            ${mobileFiltersOpen ? "block" : "hidden"} 
            lg:block
          `}
                    >
                        <div className="sticky top-24">
                            <Filters
                                filters={initialFilters}
                                onFilterChange={handleFilterChange}
                                onReset={handleReset}
                            />
                        </div>
                    </aside>

                    {/* Main Grid Area */}
                    <div className="flex-1">
                        {/* Results Header */}
                        <div className="mb-6 flex items-center justify-between">
                            <h1 className="text-xl font-bold text-slate-900">
                                {initialFilters.search
                                    ? `Results for "${initialFilters.search}"`
                                    : "Explore Collection"}
                            </h1>
                            <span className="text-sm text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full">
                                {initialPagination.total} items
                            </span>
                        </div>

                        {/* Grid */}
                        {items.length === 0 ? (
                            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
                                <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                    <Search className="w-6 h-6 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900">
                                    No items found
                                </h3>
                                <p className="text-slate-500 mt-1">
                                    Try adjusting your filters or search terms.
                                </p>
                                <button
                                    onClick={() =>
                                        handleFilterChange("search", "")
                                    }
                                    className="mt-4 text-indigo-600 font-medium hover:underline"
                                >
                                    Clear Search
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                {items.map((item) => (
                                    <ItemCard key={item.id} item={item} />
                                ))}
                            </div>
                        )}

                        {/* Load More */}
                        {hasMore && (
                            <div className="mt-12 flex justify-center">
                                <button
                                    onClick={loadMore}
                                    className="px-8 py-3 bg-white border border-slate-200 shadow-sm text-slate-700 font-medium rounded-full hover:bg-slate-50 hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
                                >
                                    Load More Listings
                                </button>
                            </div>
                        )}

                        {!hasMore && items.length > 0 && (
                            <div className="mt-12 text-center border-t border-slate-200 pt-8">
                                <p className="text-slate-400 text-sm">
                                    You&apos;ve reached the end of the list
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
