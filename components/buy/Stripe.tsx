"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
    ShieldCheck,
    Loader2,
    AlertCircle,
    Info,
    Copy,
    Check,
} from "lucide-react";

import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";

import { type ItemWithSellerWallet } from "@/data/items";
import {
    createPendingCardOrder,
    createStripePaymentIntent,
} from "@/services/orders/actions";

const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

type StripeWrapperProps = {
    item: ItemWithSellerWallet;
    onSuccess: (id: string) => void;
};

export function StripeWrapper({ item, onSuccess }: StripeWrapperProps) {
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        createStripePaymentIntent(item.id).then((res) => {
            if (res.success && res.data?.clientSecret) {
                setClientSecret(res.data.clientSecret);
            } else {
                setError(res.message || "Failed to init payment");
            }
        });
    }, [item.id]);

    if (error) {
        return (
            <div className="p-6 bg-destructive/10 text-destructive rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5" /> {error}
            </div>
        );
    }

    if (!clientSecret) {
        return (
            <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p>Securing connection with Stripe...</p>
            </div>
        );
    }

    return (
        <Elements
            stripe={stripePromise}
            options={{
                clientSecret,
                appearance: { theme: "night", labels: "floating" },
            }}
        >
            <StripePaymentForm onSuccess={onSuccess} />
        </Elements>
    );
}

// --- HELPER: Click-to-Copy Test Credentials ---
function TestCredentials() {
    const [copied, setCopied] = useState(false);
    const TEST_CARD = "4242 4242 4242 4242";

    const handleCopy = () => {
        navigator.clipboard.writeText(TEST_CARD);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-6">
            <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <h4 className="text-sm font-bold text-blue-500">
                        Portfolio Demo Mode
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        This is a test transaction. You will not be charged. Use
                        the Stripe test card details below:
                    </p>

                    <div className="flex items-center gap-2 mt-3">
                        <code className="px-2 py-1 bg-background rounded-md border border-border text-xs font-mono text-foreground">
                            {TEST_CARD}
                        </code>
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background border border-border hover:bg-muted text-xs font-medium transition-colors"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-3 h-3 text-green-500" />
                                    <span className="text-green-500">
                                        Copied
                                    </span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                </>
                            )}
                        </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                        Expiry: Any future date &bull; CVC: Any 3 digits &bull;
                        ZIP: 12345
                    </p>
                </div>
            </div>
        </div>
    );
}

// 3. STRIPE FORM
function StripePaymentForm({ onSuccess }: { onSuccess: (id: string) => void }) {
    const stripe = useStripe();
    const elements = useElements();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsLoading(true);
        setErrorMessage(null);

        // 1. Confirm Payment with Stripe
        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: "if_required",
            confirmParams: {
                return_url: window.location.href,
            },
        });

        if (error) {
            setErrorMessage(error.message || "Payment failed");
            setIsLoading(false);
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
            // 2. Create Order in DB
            const res = await createPendingCardOrder({
                stripePaymentId: paymentIntent.id,
            });

            if (res.success && res.data?.orderId) {
                onSuccess(res.data.orderId);
            } else {
                setErrorMessage(
                    res.message ||
                        "Payment succeeded but order creation failed.",
                );
                setIsLoading(false);
            }
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-card border border-border rounded-xl p-8 shadow-sm space-y-6 animate-in fade-in zoom-in duration-300"
        >
            <h2 className="text-lg font-bold text-foreground">Card Details</h2>

            {/* Test Mode Banner */}
            <TestCredentials />

            <PaymentElement />

            {errorMessage && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md flex gap-2 items-center">
                    <AlertCircle className="w-4 h-4" /> {errorMessage}
                </div>
            )}

            <button
                disabled={!stripe || isLoading}
                className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <ShieldCheck className="w-4 h-4" />
                )}
                {isLoading ? "Processing..." : "Pay Now"}
            </button>
        </form>
    );
}
