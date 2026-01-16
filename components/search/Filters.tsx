"use client";

import { useState, useEffect } from "react";
import { Search, RotateCcw, DollarSign, X } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { type ItemFilters } from "@/db/validation";

interface FiltersProps {
    filters: ItemFilters;
    onFilterChange: (key: string, value: string | undefined) => void;
    onReset: () => void;
}

export default function Filters({
    filters,
    onFilterChange,
    onReset,
}: FiltersProps) {
    const [localSearch, setLocalSearch] = useState(filters.search || "");
    const [localMin, setLocalMin] = useState(
        filters.minPrice?.toString() || ""
    );
    const [localMax, setLocalMax] = useState(
        filters.maxPrice?.toString() || ""
    );

    // Sync state from Parent (URL)
    useEffect(() => {
        const syncFilters = () => {
            setLocalSearch(filters.search || "");
            setLocalMin(filters.minPrice?.toString() || "");
            setLocalMax(filters.maxPrice?.toString() || "");
        };

        syncFilters();
    }, [filters]);

    const debouncedUpdate = useDebouncedCallback(
        (key: string, value: string) => {
            onFilterChange(key, value);
        },
        500
    );

    const handleSearchChange = (val: string) => {
        setLocalSearch(val);
        debouncedUpdate("search", val);
    };

    const handlePriceChange = (key: "minPrice" | "maxPrice", val: string) => {
        if (key === "minPrice") setLocalMin(val);
        if (key === "maxPrice") setLocalMax(val);
        debouncedUpdate(key, val);
    };

    const handleReset = () => {
        // 1. Cancel any pending debounce (search/price typing)
        debouncedUpdate.cancel();

        // 2. Clear visual inputs immediately
        setLocalSearch("");
        setLocalMin("");
        setLocalMax("");

        // 3. Tell Parent to wipe the URL
        onReset();
    };

    // Active filter count logic
    const activeCount = [
        filters.search,
        filters.minPrice !== undefined,
        filters.maxPrice !== undefined,
        filters.condition,
    ].filter(Boolean).length;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    Filters
                    {activeCount > 0 && (
                        <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
                            {activeCount}
                        </span>
                    )}
                </h3>

                <button
                    onClick={handleReset}
                    className={`text-xs text-muted-foreground flex items-center gap-1 transition-all duration-300 ease-in-out ${
                        activeCount === 0
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:text-destructive"
                    }`}
                    disabled={activeCount === 0}
                >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                </button>
            </div>

            {/* --- Inputs (Same as before) --- */}
            <div className="space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Keywords
                </label>
                <div className="relative group">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/70 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={localSearch}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full pl-9 pr-9 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all placeholder:text-muted-foreground/50 shadow-sm"
                    />
                    {localSearch && (
                        <button
                            onClick={() => handleSearchChange("")}
                            className="absolute right-3 top-2.5 text-muted-foreground/50 hover:text-muted-foreground"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Price Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <div className="relative group">
                        <DollarSign className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground/70 group-focus-within:text-primary transition-colors" />
                        <input
                            type="number"
                            placeholder="Min"
                            value={localMin}
                            onChange={(e) =>
                                handlePriceChange("minPrice", e.target.value)
                            }
                            className="w-full pl-8 pr-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all shadow-sm"
                        />
                    </div>
                    <div className="relative group">
                        <DollarSign className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground/70 group-focus-within:text-primary transition-colors" />
                        <input
                            type="number"
                            placeholder="Max"
                            value={localMax}
                            onChange={(e) =>
                                handlePriceChange("maxPrice", e.target.value)
                            }
                            className="w-full pl-8 pr-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Condition
                </label>
                <div className="relative">
                    <select
                        value={filters.condition || ""}
                        onChange={(e) =>
                            onFilterChange(
                                "condition",
                                e.target.value || undefined
                            )
                        }
                        className="w-full appearance-none bg-card border border-border text-foreground text-sm rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent block p-2.5 outline-none shadow-sm cursor-pointer hover:border-border/80 transition-colors"
                    >
                        <option value="">Any Condition</option>
                        <option value="new">New</option>
                        <option value="like-new">Like New</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="poor">Poor</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                        <svg
                            className="fill-current h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                        >
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
}
