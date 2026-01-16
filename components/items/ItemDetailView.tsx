"use client";

import { useState } from "react";
import Image from "next/image";
import { MessageCircle, ShoppingBag, Clock, ShieldCheck, User, Info, Tag, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { type ItemWithSeller } from "@/data/items";

interface ItemDetailViewProps {
    item: ItemWithSeller;
    isModal?: boolean;
}

export default function ItemDetailView({ item, isModal = false }: ItemDetailViewProps) {
    const [activeImage, setActiveImage] = useState(0);

    return (
        <div className={`flex flex-col lg:flex-row bg-card rounded-2xl overflow-hidden ${isModal ? 'max-h-[90vh]' : 'min-h-[600px] shadow-sm border border-border'}`}>
            {/* Left Side: Images */}
            <div className={`lg:w-3/5 relative bg-muted/30 flex flex-col ${isModal ? 'min-h-[300px] lg:min-h-0' : 'min-h-[500px]'}`}>
                <div className="relative flex-1 group">
                    {item.images && item.images.length > 0 ? (
                        <Image
                            src={item.images[activeImage]}
                            alt={item.title}
                            fill
                            className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.02]"
                            priority
                            unoptimized
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <span className="text-sm">No Preview Available</span>
                        </div>
                    )}
                </div>

                {/* Image Thumbnails */}
                {item.images && item.images.length > 1 && (
                    <div className="p-4 flex gap-3 overflow-x-auto bg-card/40 backdrop-blur-md border-t border-border scrollbar-hide">
                        {item.images.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveImage(idx)}
                                className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all duration-200 ${
                                    activeImage === idx 
                                        ? 'border-primary ring-4 ring-primary/10 shadow-md' 
                                        : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                                }`}
                            >
                                <Image
                                    src={img}
                                    alt={`${item.title} thumbnail ${idx + 1}`}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Right Side: Details */}
            <div className={`lg:w-2/5 flex flex-col ${isModal ? 'overflow-y-auto' : ''}`}>
                <div className={`flex flex-col flex-1 p-6 lg:p-10 ${isModal ? 'pt-14 lg:pt-14' : ''}`}>
                    {/* Top Meta Info */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                {item.status || 'Available'}
                            </span>
                            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                            </span>
                        </div>
                    </div>

                    {/* Title & Price */}
                    <div className="mb-8">
                        <h2 className="text-3xl font-black text-foreground mb-4 leading-tight tracking-tight">
                            {item.title}
                        </h2>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-primary">
                                ${Number(item.price).toLocaleString()}
                            </span>
                            <span className="text-sm font-medium text-muted-foreground">USD</span>
                        </div>
                    </div>

                    {/* Quick Specs Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-4 rounded-2xl bg-muted/50 border border-border flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                <Tag className="w-3 h-3" />
                                Condition
                            </span>
                            <span className="text-sm font-bold text-foreground capitalize">
                                {item.condition.replace("-", " ")}
                            </span>
                        </div>
                        <div className="p-4 rounded-2xl bg-muted/50 border border-border flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" />
                                Listed
                            </span>
                            <span className="text-sm font-bold text-foreground">
                                {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                    </div>

                    {/* Description Section */}
                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-3">
                            <Info className="w-4 h-4 text-accent" />
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Details</h3>
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none">
                            <p className="text-muted-foreground leading-relaxed text-base italic">
                                "{item.description || "The seller has not provided a detailed description for this unique item."}"
                            </p>
                        </div>
                    </div>

                    {/* Seller Info Card */}
                    <div className="mt-auto pt-8 border-t border-border">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Curated By</h3>
                        </div>
                        <div className="flex items-center gap-4 group">
                            <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center overflow-hidden relative border-2 border-border shadow-sm transition-transform group-hover:scale-105">
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
                                <div className="font-black text-foreground text-lg group-hover:text-primary transition-colors">
                                    {item.seller?.name || "Anonymous Vendor"}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                        <ShieldCheck className="w-2.5 h-2.5 text-primary-foreground" />
                                    </div>
                                    Verified Seller
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-4 mt-10 pb-4">
                        <button 
                            className="w-full h-16 bg-foreground hover:bg-black text-background font-black rounded-2xl shadow-xl shadow-black/20 transition-all flex items-center justify-center gap-3 group active:scale-[0.98] overflow-hidden relative"
                            onClick={() => alert('Purchase flow would start here!')}
                        >
                            <span className="relative z-10 flex items-center gap-3">
                                <ShoppingBag className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                Buy Now
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </button>
                        <button 
                            className="w-full h-14 bg-card border-2 border-border hover:border-foreground text-foreground font-bold rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] hover:shadow-lg"
                            onClick={() => alert('Messaging flow would start here!')}
                        >
                            <MessageCircle className="w-5 h-5" />
                            Message Seller
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
