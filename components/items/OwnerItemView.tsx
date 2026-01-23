"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import {
    Clock,
    ShieldCheck,
    Info,
    Tag,
    ChevronLeft,
    ChevronRight,
    Edit,
    Trash2,
    Eye,
    BarChart3,
    MessageSquare,
    Heart,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import useEmblaCarousel from "embla-carousel-react";
import { type ItemWithSeller } from "@/data/items";

interface OwnerItemViewProps {
    item: ItemWithSeller;
    isModal?: boolean;
}

export default function OwnerItemView({
    item,
    isModal = false,
}: OwnerItemViewProps) {
    // --- Carousel Logic ---
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
    const [selectedIndex, setSelectedIndex] = useState(0);

    const scrollPrev = useCallback(
        () => emblaApi && emblaApi.scrollPrev(),
        [emblaApi],
    );
    const scrollNext = useCallback(
        () => emblaApi && emblaApi.scrollNext(),
        [emblaApi],
    );
    const scrollTo = useCallback(
        (index: number) => emblaApi && emblaApi.scrollTo(index),
        [emblaApi],
    );

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        emblaApi.on("select", onSelect);
    }, [emblaApi, onSelect]);

    // --- Handlers ---
    const handleEdit = () => {
        alert("Edit functionality coming soon!");
    };

    const handleDelete = () => {
        if (confirm("Are you sure?")) {
            alert("Delete functionality coming soon!");
        }
    };

    return (
        <div
            className={`relative flex flex-col bg-card rounded-2xl overflow-hidden border-l-4 border-l-primary ${isModal ? "max-h-[95vh] w-full" : "min-h-[600px] shadow-sm border border-border"}`}
        >
            {/* --- Owner Banner --- */}
            <div
                className={`bg-primary/5 px-6 py-3 flex items-center justify-between border-b border-primary/10 shrink-0 ${isModal ? "pr-16" : ""}`}
            >
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <Eye className="w-4 h-4" />
                    <span>You are viewing your own listing</span>
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                    Status:{" "}
                    <span className="uppercase font-bold text-foreground">
                        {item.status}
                    </span>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div
                className={`flex-1 ${isModal ? "overflow-y-auto scrollbar-hide" : ""}`}
            >
                {/* --- Top Section: Slideshow --- */}
                <div className="relative group bg-muted/30 shrink-0">
                    <div className="overflow-hidden" ref={emblaRef}>
                        <div className="flex">
                            {item.images && item.images.length > 0 ? (
                                item.images.map((img, idx) => (
                                    <div
                                        key={idx}
                                        className="relative flex-[0_0_100%] min-w-0 aspect-[16/9] sm:aspect-[21/9]"
                                    >
                                        <Image
                                            src={img}
                                            alt={`${item.title} - Image ${idx + 1}`}
                                            fill
                                            className="object-contain p-4 md:p-8"
                                            priority={idx === 0}
                                            unoptimized
                                        />
                                    </div>
                                ))
                            ) : (
                                <div className="relative flex-[0_0_100%] min-w-0 aspect-[16/9] flex items-center justify-center text-muted-foreground">
                                    <span className="text-sm">
                                        No Preview Available
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Navigation Arrows */}
                    {item.images && item.images.length > 1 && (
                        <>
                            <button
                                onClick={scrollPrev}
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/60 backdrop-blur-md border border-border flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                                onClick={scrollNext}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/60 backdrop-blur-md border border-border flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>

                            {/* Pagination Dots */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                                {item.images.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => scrollTo(idx)}
                                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                            selectedIndex === idx
                                                ? "bg-primary w-6"
                                                : "bg-foreground/20 hover:bg-foreground/40"
                                        }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Sub-divider */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent shrink-0" />

                <div className="p-6 md:p-10 lg:p-12">
                    <div className="max-w-4xl mx-auto space-y-10">
                        <div className="flex flex-col gap-8 pb-6 border-b border-border/50">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <div className="space-y-4 flex-1">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            Listed{" "}
                                            {formatDistanceToNow(
                                                new Date(item.createdAt),
                                                { addSuffix: true },
                                            )}
                                        </span>
                                    </div>
                                    <h2 className="text-4xl md:text-5xl font-black text-foreground leading-tight tracking-tight">
                                        {item.title}
                                    </h2>
                                </div>

                                <div className="flex flex-col items-start md:items-end">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-black text-primary">
                                            $
                                            {Number(
                                                item.price,
                                            ).toLocaleString()}
                                        </span>
                                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                                            USD
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* --- OWNER ACTIONS (Inline for Desktop) --- */}
                            {!isModal && (
                                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                                    <button
                                        onClick={handleEdit}
                                        className="flex-1 py-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold rounded-xl flex items-center justify-center gap-3 transition-colors active:scale-[0.98]"
                                    >
                                        <Edit className="w-5 h-5" />
                                        Edit Listing
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="flex-1 py-4 bg-destructive/10 hover:bg-destructive/20 text-destructive font-bold rounded-xl flex items-center justify-center gap-3 transition-colors active:scale-[0.98]"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                        Delete Item
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-4">
                            {/* Left Column: Description & Specs */}
                            <div className="lg:col-span-2 space-y-8">
                                <section className="space-y-6">
                                    <div className="flex items-center gap-2">
                                        <Info className="w-5 h-5 text-accent" />
                                        <h3 className="text-lg font-black text-foreground uppercase tracking-widest">
                                            Description
                                        </h3>
                                    </div>
                                    <div className="prose prose-invert prose-lg max-w-none">
                                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                            {item.description ||
                                                "No description provided."}
                                        </p>
                                    </div>
                                </section>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-5 rounded-2xl bg-muted/10 border border-border flex flex-col gap-2">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                            <Tag className="w-3.5 h-3.5 text-accent" />{" "}
                                            Condition
                                        </span>
                                        <span className="text-base font-bold text-foreground capitalize">
                                            {item.condition.replace("-", " ")}
                                        </span>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-muted/10 border border-border flex flex-col gap-2">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />{" "}
                                            Visibility
                                        </span>
                                        <span className="text-base font-bold text-foreground capitalize">
                                            Public
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Listing Insights */}
                            <div className="space-y-6">
                                <div className="p-6 rounded-2xl border border-border bg-muted/20">
                                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4" />
                                        Listing Insights
                                    </h3>

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-background border border-border text-muted-foreground">
                                                    <Eye className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-medium text-muted-foreground">
                                                    Total Views
                                                </span>
                                            </div>
                                            <span className="text-xl font-bold text-foreground">
                                                0
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-background border border-border text-muted-foreground">
                                                    <Heart className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-medium text-muted-foreground">
                                                    Saves
                                                </span>
                                            </div>
                                            <span className="text-xl font-bold text-foreground">
                                                0
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-background border border-border text-muted-foreground">
                                                    <MessageSquare className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-medium text-muted-foreground">
                                                    Inquiries
                                                </span>
                                            </div>
                                            <span className="text-xl font-bold text-foreground">
                                                0
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-border">
                                        <p className="text-xs text-muted-foreground text-center">
                                            Analytics are updated every 24
                                            hours.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Spacer for bottom bar if modal */}
                    {isModal && <div className="h-24 md:h-28" />}
                </div>
            </div>

            {/* --- Floating Actions (Modal Only) --- */}
            {isModal && (
                <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row gap-4 z-30 pointer-events-none justify-end pr-3">
                    <button
                        onClick={handleEdit}
                        className="bg-secondary/90 hover:bg-secondary/95 text-secondary-foreground font-black rounded-2xl backdrop-blur-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-2xl shadow-black/40 border border-white/20 pointer-events-auto px-6 py-3"
                    >
                        <Edit className="w-5 h-5" />
                        Edit
                    </button>
                    <button
                        onClick={handleDelete}
                        className="bg-destructive/90 hover:bg-destructive/95 text-white font-bold rounded-2xl backdrop-blur-2xl transition-all border border-white/10 flex items-center justify-center gap-3 active:scale-[0.98] shadow-2xl shadow-black/40 pointer-events-auto px-6 py-3"
                    >
                        <Trash2 className="w-5 h-5" />
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
}
