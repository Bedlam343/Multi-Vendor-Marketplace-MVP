import { Search } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { type ItemFilters } from "@/db/validation";

export default function Filters({
    filters,
    onFilterChange,
}: {
    filters: ItemFilters;
    onFilterChange: (key: string, value: string) => void;
}) {
    const debouncedChange = useDebouncedCallback(onFilterChange, 500);

    return (
        <div className="space-y-8">
            {/* Search Input */}
            <div className="relative">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                    Keywords
                </label>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search items..."
                        defaultValue={filters.search}
                        onChange={(e) =>
                            debouncedChange("search", e.target.value)
                        }
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Price Inputs */}
            <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                    Price Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-400 text-sm">
                            $
                        </span>
                        <input
                            type="number"
                            placeholder="Min"
                            defaultValue={filters.minPrice}
                            onChange={(e) =>
                                debouncedChange("minPrice", e.target.value)
                            }
                            className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-400 text-sm">
                            $
                        </span>
                        <input
                            type="number"
                            placeholder="Max"
                            defaultValue={filters.maxPrice}
                            onChange={(e) =>
                                debouncedChange("maxPrice", e.target.value)
                            }
                            className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Condition Select */}
            <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                    Condition
                </label>
                <div className="relative">
                    <select
                        defaultValue={filters.condition || ""}
                        onChange={(e) =>
                            onFilterChange("condition", e.target.value)
                        }
                        className="w-full appearance-none bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent block p-2.5 outline-none"
                    >
                        <option value="">Any Condition</option>
                        <option value="new">New</option>
                        <option value="like-new">Like New</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="poor">Poor</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
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
