import { type ItemWithSellerWallet } from "@/data/items";
import { ShieldCheck } from "lucide-react";

export default function OrderSummary({ item }: { item: ItemWithSellerWallet }) {
    const shippingCost = 8.0;
    const totalUsd = Number(item.price) + shippingCost;

    return (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm sticky top-24">
            <h3 className="font-bold text-card-foreground mb-4">
                Order Summary
            </h3>
            <div className="flex gap-4 mb-6 pb-6 border-b border-border">
                <div className="w-16 h-16 bg-secondary rounded-lg overflow-hidden relative border border-border">
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                        IMG
                    </div>
                </div>
                <div>
                    <h4 className="font-medium text-foreground line-clamp-2">
                        {item.title}
                    </h4>
                    <p className="text-muted-foreground text-sm">Qty: 1</p>
                </div>
            </div>
            <div className="space-y-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>${item.price}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>${shippingCost}</span>
                </div>
                <div className="flex justify-between font-bold text-foreground pt-3 border-t border-border text-base">
                    <span>Total</span>
                    <span>${totalUsd.toFixed(2)}</span>
                </div>
            </div>
            <div className="mt-6 text-xs text-muted-foreground flex gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-primary" />
                <span>Buyer Protection Guarantee included.</span>
            </div>
        </div>
    );
}
