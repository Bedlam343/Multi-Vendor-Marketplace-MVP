"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

import { type NonNullBuyer } from "@/data/user";
import { type ItemWithSellerWallet } from "@/data/items";
import { checkOrderStatus } from "@/services/orders/actions";

import ProcessingView from "@/components/buy/ProcessingView";
import SuccessView from "@/components/buy/SuccessView";
import OrderSummary from "@/components/buy/OrderSummary";
import CryptoPaymentForm from "@/components/buy/CryptoPaymentForm";
import PaymentSelector from "@/components/buy/PaymentSelector";
import { StripeWrapper } from "@/components/buy/Stripe";

const IS_MOCK_MODE = true;

type BuyItemProps = {
    item: ItemWithSellerWallet;
    buyer: NonNullBuyer;
};

type ViewState =
    | "selection"
    | "card_form"
    | "crypto_form"
    | "processing"
    | "success";

export default function BuyItem({ item, buyer }: BuyItemProps) {
    const router = useRouter();

    // --- STATE ---
    const [view, setView] = useState<ViewState>("selection");
    const [paymentMethod, setPaymentMethod] = useState<"card" | "crypto">(
        "card",
    );
    const [processingStep, setProcessingStep] = useState(1);
    const [txHash, setTxHash] = useState("");

    // Helper to transition to processing view
    const handleStartProcessing = (hash: string, step: number) => {
        setTxHash(hash);
        setProcessingStep(step);
        setView("processing");
    };

    // Polling Logic
    const startPolling = async (orderId: string) => {
        const maxAttempts = 30;
        let attempts = 0;

        const interval = setInterval(async () => {
            attempts++;
            try {
                const result = await checkOrderStatus(orderId);
                let status = result?.data?.status || "failed";

                if (status === "completed") {
                    clearInterval(interval);
                    setProcessingStep(3); // Visual: Finalizing
                    setTimeout(() => setView("success"), 2500); // Artificial Delay
                } else if (status === "failed") {
                    clearInterval(interval);
                    alert("Order verification failed. Please contact support.");
                    setView("selection");
                }

                if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    alert(
                        "Transaction is taking a while. Check dashboard later.",
                    );
                    router.push("/dashboard");
                }
            } catch (err) {
                console.error("Polling error", err);
            }
        }, 3000);
    };

    if (view === "processing") {
        return (
            <ProcessingView
                mode={paymentMethod}
                txHash={txHash}
                step={processingStep}
            />
        );
    }

    if (view === "success") {
        return <SuccessView router={router} itemTitle={item.title} />;
    }

    return (
        <div className="min-h-screen bg-background text-foreground py-12 font-sans">
            <div className="max-w-5xl mx-auto px-4 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* LEFT COL: DYNAMIC CONTENT */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Back Button */}
                        {view !== "selection" && (
                            <button
                                onClick={() => setView("selection")}
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back to
                                methods
                            </button>
                        )}

                        {/* 1. SELECTION VIEW */}
                        {view === "selection" && (
                            <PaymentSelector
                                onSelectCard={() => {
                                    setPaymentMethod("card");
                                    setView("card_form");
                                }}
                                onSelectCrypto={() => {
                                    setPaymentMethod("crypto");
                                    setView("crypto_form");
                                }}
                                isCryptoDisabled={
                                    !item.seller?.cryptoWalletAddress
                                }
                            />
                        )}

                        {/* 2. CARD FLOW */}
                        {view === "card_form" && (
                            <StripeWrapper
                                item={item}
                                onSuccess={(orderId) => {
                                    handleStartProcessing("", 3); // Jump to step 3 for cards
                                    startPolling(orderId);
                                }}
                            />
                        )}

                        {/* 3. CRYPTO FLOW */}
                        {view === "crypto_form" && (
                            <CryptoPaymentForm
                                isMockMode={IS_MOCK_MODE}
                                item={item}
                                buyer={buyer}
                                onTxSent={(hash) =>
                                    handleStartProcessing(hash, 1)
                                }
                                onOrderCreated={(orderId) =>
                                    startPolling(orderId)
                                }
                            />
                        )}
                    </div>

                    {/* RIGHT COL: SUMMARY */}
                    <div className="lg:col-span-1">
                        <OrderSummary item={item} />
                    </div>
                </div>
            </div>
        </div>
    );
}
