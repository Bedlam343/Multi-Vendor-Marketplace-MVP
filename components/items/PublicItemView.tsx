"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    MessageCircle,
    ShoppingBag,
    Clock,
    ShieldCheck,
    User,
    Info,
    Tag,
    Calendar,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import useEmblaCarousel from "embla-carousel-react";

import { useSession } from "@/lib/auth-client";
import { type ItemWithSeller } from "@/data/items";
import FirstMessageModal from "@/components/chat/FirstMessageModal";

interface PublicItemViewProps {
    item: ItemWithSeller;
    isModal?: boolean;
}

export default function PublicItemView({
    item,
    isModal = false,
}: PublicItemViewProps) {
    const { data: userData } = useSession();

    const router = useRouter();
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
    const [selectedIndex, setSelectedIndex] = useState(0);

    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

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

    const handleMessageSeller = () => {
        if (!userData) {
            router.push("/login");
            return;
        }
        setIsMessageModalOpen(true);
    };

    return (
        <div
            className={`relative flex flex-col bg-card rounded-2xl overflow-hidden ${isModal ? "max-h-[95vh] w-full" : "min-h-[600px] shadow-sm border border-border"}`}
        >
            {/* Scrollable Content Area */}
            <div
                className={`flex-1 ${isModal ? "overflow-y-auto scrollbar-hide" : ""}`}
            >
                {/* Top Section: Slideshow */}
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
                                aria-label="Previous slide"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                                onClick={scrollNext}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/60 backdrop-blur-md border border-border flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card"
                                aria-label="Next slide"
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

                {/* Sub-divider for physical distinction */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent shrink-0" />

                {/* Bottom Section: Details */}
                <div className="p-6 md:p-10 lg:p-12">
                    <div className="max-w-4xl mx-auto space-y-10">
                        {/* Header: Title, Price, Status */}
                        <div className="flex flex-col gap-8 pb-6">
                            <div
                                className="flex flex-col md:flex-row md:items-end 
                                justify-between gap-6"
                            >
                                <div className="space-y-4 flex-1">
                                    <div className="flex items-center gap-3">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                            {item.status || "Available"}
                                        </span>
                                        <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
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

                            {/* Action Buttons for non-modal (inline) */}
                            {!isModal && (
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Link
                                        href={`/buy/${item.id}`}
                                        className="flex-1 min-w-[200px] py-4 bg-primary hover:bg-primary/90 
                                        text-primary-foreground font-black rounded-xl transition-all flex 
                                        items-center justify-center gap-3 active:scale-[0.98] shadow-lg shadow-primary/20"
                                    >
                                        <ShoppingBag className="w-5 h-5" />
                                        Buy Now
                                    </Link>
                                    <button
                                        className="flex-1 min-w-[200px] py-4 bg-card border border-border hover:border-primary text-foreground font-bold rounded-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                        onClick={handleMessageSeller}
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                        Message Seller
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Quick Specs Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-5 rounded-2xl bg-muted/10 border border-border flex flex-col gap-2 transition-colors hover:bg-muted/20">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                    <Tag className="w-3.5 h-3.5 text-accent" />
                                    Condition
                                </span>
                                <span className="text-base font-bold text-foreground capitalize">
                                    {item.condition.replace("-", " ")}
                                </span>
                            </div>
                            <div className="p-5 rounded-2xl bg-muted/10 border border-border flex flex-col gap-2 transition-colors hover:bg-muted/20">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-primary" />
                                    Listed On
                                </span>
                                <span className="text-base font-bold text-foreground">
                                    {new Date(
                                        item.createdAt,
                                    ).toLocaleDateString(undefined, {
                                        month: "long",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </span>
                            </div>
                            <div className="p-5 rounded-2xl bg-muted/10 border border-border flex flex-col gap-2 transition-colors hover:bg-muted/20">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                    Protection
                                </span>
                                <span className="text-base font-bold text-foreground">
                                    Full Coverage
                                </span>
                            </div>
                            <div className="p-5 rounded-2xl bg-muted/10 border border-border flex flex-col gap-2 transition-colors hover:bg-muted/20">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-primary" />
                                    Availability
                                </span>
                                <span className="text-base font-bold text-foreground">
                                    {item.status.charAt(0).toUpperCase() +
                                        item.status.slice(1)}
                                </span>
                            </div>
                        </div>

                        {/* Main Content Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-4">
                            {/* Left: Description */}
                            <div className="lg:col-span-2 space-y-8">
                                <section className="space-y-6">
                                    <div className="flex items-center gap-2">
                                        <Info className="w-5 h-5 text-accent" />
                                        <h3 className="text-lg font-black text-foreground uppercase tracking-widest">
                                            About this item
                                        </h3>
                                    </div>
                                    <div className="prose prose-invert prose-lg max-w-none">
                                        <p className="text-muted-foreground leading-relaxed italic">
                                            "
                                            {item.description ||
                                                "The seller has not provided a detailed description for this unique item."}
                                            "
                                        </p>
                                    </div>
                                </section>

                                {/* Separate Marketplace Guarantee Message */}
                                <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex gap-4 items-start">
                                    <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-foreground">
                                            Marketplace Guarantee
                                        </h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            All items on our marketplace are
                                            thoroughly inspected for quality and
                                            authenticity. This item is currently
                                            held by the seller and is ready for
                                            immediate dispatch upon purchase.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Seller Information */}
                            <div className="space-y-6">
                                <div className="p-6 rounded-2xl border border-border bg-muted/20">
                                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">
                                        Seller Identity
                                    </h3>
                                    <div className="flex items-center gap-4 group">
                                        <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center overflow-hidden relative border border-border shadow-sm">
                                            {item.seller?.image ? (
                                                <Image
                                                    src={item.seller.image}
                                                    alt={item.seller.name || ""}
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                            ) : (
                                                <User className="w-6 h-6 text-primary" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-foreground text-base">
                                                {item.seller?.name ||
                                                    "Anonymous"}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                                                <ShieldCheck className="w-3 h-3 text-primary" />
                                                Verified Seller
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Add spacer for the fixed bottom bar on mobile/modal */}
                    {isModal && <div className="h-24 md:h-28" />}
                </div>
            </div>

            <FirstMessageModal
                isOpen={isMessageModalOpen}
                onClose={() => setIsMessageModalOpen(false)}
                item={item}
            />

            {isModal && (
                <div
                    className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row 
                gap-4 z-30 pointer-events-none justify-end pr-3"
                >
                    <Link
                        href={`/buy/${item.id}`}
                        target="_blank"
                        className="bg-primary/90 hover:bg-primary/95 text-white 
                        font-black rounded-2xl backdrop-blur-2xl transition-all flex items-center 
                        justify-center gap-3 active:scale-[0.98] shadow-2xl shadow-black/40 border 
                        border-white/20 pointer-events-auto px-6 py-3"
                    >
                        <ShoppingBag className="w-5 h-5" />
                        Buy Now
                    </Link>
                    <button
                        className="bg-white/10 hover:bg-white/20 text-white font-bold 
                        rounded-2xl backdrop-blur-2xl transition-all border border-white/10 flex 
                        items-center justify-center gap-3 active:scale-[0.98] shadow-2xl shadow-black/40 
                        pointer-events-auto px-6 py-3"
                        onClick={handleMessageSeller}
                    >
                        <MessageCircle className="w-5 h-5" />
                        Message Seller
                    </button>
                </div>
            )}
        </div>
    );
}
