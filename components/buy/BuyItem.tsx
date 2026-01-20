"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import {
    CreditCard,
    Wallet,
    ShieldCheck,
    Loader2,
    CheckCircle,
    ExternalLink,
    Clock,
    ArrowRight,
} from "lucide-react";

import { createThirdwebClient, prepareTransaction, toWei } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import {
    ConnectButton,
    useActiveAccount,
    useSendTransaction,
} from "thirdweb/react";

import { type NonNullBuyer } from "@/data/user";
import { type ItemWithSellerWallet } from "@/data/items";
import {
    createPendingCryptoOrder,
    checkOrderStatus,
} from "@/services/orders/actions";
import { getEthPriceInUsd } from "@/utils/helpers";
import { SEPOLIA_CHAIN_ID } from "@/utils/constants";

const thirdWebClientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
if (!thirdWebClientId) {
    throw new Error("Thirdweb Client ID not found");
}

const client = createThirdwebClient({
    clientId: thirdWebClientId,
});
const chain = defineChain(SEPOLIA_CHAIN_ID);

type BuyItemProps = {
    item: ItemWithSellerWallet;
    buyer: NonNullBuyer;
};

type ViewState = "form" | "processing" | "success";

export default function BuyItem({ item, buyer }: BuyItemProps) {
    const router = useRouter();

    // --- STATE ---
    const [view, setView] = useState<ViewState>("form");
    const [paymentMethod, setPaymentMethod] = useState<"card" | "crypto">(
        buyer.cryptoWalletAddress && !buyer.savedCardLast4 ? "crypto" : "card",
    );

    // Data State
    const [txHash, setTxHash] = useState<string>("");
    const [ethPrice, setEthPrice] = useState<number | null>(null);

    // Loading States
    const [isProcessingCard, setIsProcessingCard] = useState(false);
    const [isFetchingPrice, setIsFetchingPrice] = useState(false);

    const isCryptoDisabled = !item.seller?.cryptoWalletAddress;

    // Costs
    const shippingCost = 8.0;
    const totalUsd = Number(item.price) + shippingCost;
    const totalEth = ethPrice ? (totalUsd / ethPrice).toFixed(6) : "0.00";

    // Web3 Hooks
    const account = useActiveAccount();
    const { mutate: sendTransaction, isPending: isTxPending } =
        useSendTransaction();

    // --- EFFECTS ---
    useEffect(() => {
        if (paymentMethod === "crypto" && !ethPrice) {
            setIsFetchingPrice(true);
            getEthPriceInUsd().then((price) => {
                setEthPrice(price);
                setIsFetchingPrice(false);
            });
        }
    }, [paymentMethod, ethPrice]);

    // --- HANDLERS ---

    // 1. POLLING LOGIC
    const startPolling = async (orderId: string) => {
        const maxAttempts = 30; // ~90 seconds
        let attempts = 0;

        const interval = setInterval(async () => {
            attempts++;
            try {
                const result = await checkOrderStatus(orderId);

                let status = "failed";
                if (result && "status" in result) {
                    status = result.status;
                }

                if (status === "completed") {
                    clearInterval(interval);
                    setView("success");
                } else if (status === "failed") {
                    clearInterval(interval);
                    alert("Order verification failed. Please contact support.");
                    setView("form");
                }

                if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    alert(
                        "Transaction is taking a while. You can safely check your dashboard later.",
                    );
                    router.push("/dashboard");
                }
            } catch (err) {
                console.error("Polling error", err);
            }
        }, 3000);
    };

    // 2. CRYPTO FLOW
    const handleCryptoPayment = () => {
        if (!account) return alert("Please connect your wallet first");

        const sellerWallet = item.seller?.cryptoWalletAddress;
        if (!sellerWallet) return alert("Seller has no crypto wallet");

        console.log("Buyer wallet:", account.address);
        console.log("Seller Wallet:", sellerWallet);

        const weiValue = toWei(totalEth.toString());
        const transaction = prepareTransaction({
            to: sellerWallet,
            chain: chain,
            client: client,
            value: weiValue,
        });

        sendTransaction(transaction, {
            onSuccess: async (txResult) => {
                console.log("Tx Sent:", txResult.transactionHash);
                setTxHash(txResult.transactionHash);

                // A. IMMEDIATE UI SWAP -> Processing View
                setView("processing");

                // B. Create Pending Order
                const result = await createPendingCryptoOrder({
                    itemId: item.id,
                    amountPaidCrypto: totalEth,
                    amountPaidUsd: String(totalUsd),
                    txHash: txResult.transactionHash,
                    buyerWalletAddress: account.address,
                });

                // C. Start Polling if order created
                if (result.success && result.orderId) {
                    console.log("Order Created. Polling...", result.orderId);
                    startPolling(result.orderId);
                } else {
                    alert(
                        "Payment sent, but order creation failed. Save your Tx Hash: " +
                            txResult.transactionHash,
                    );
                }
            },
            onError: (error) => {
                console.error("Tx Failed", error);
                alert("Transaction Failed. Check console.");
            },
        });
    };

    // 3. CARD FLOW
    const handleCardPayment = async (e: FormEvent) => {
        e.preventDefault();
        setIsProcessingCard(true);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setIsProcessingCard(false);
        setView("success");
    };

    // --- RENDER VIEWS ---

    if (view === "success") {
        return <SuccessView router={router} itemTitle={item.title} />;
    }

    return (
        <div className="min-h-screen bg-background text-foreground py-12 font-sans">
            <div className="max-w-5xl mx-auto px-4 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* LEFT COL: PAYMENT FORMS OR PROCESSING VIEW */}
                    <div className="lg:col-span-2 space-y-6">
                        {view === "processing" ? (
                            <ProcessingView txHash={txHash} />
                        ) : (
                            <>
                                {/* Method Toggle */}
                                <div className="bg-card p-1 rounded-xl border border-border flex gap-1 shadow-sm relative z-0">
                                    <button
                                        onClick={() => setPaymentMethod("card")}
                                        className={`flex-1 py-3 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
                                            paymentMethod === "card"
                                                ? "bg-primary text-primary-foreground shadow-md font-bold"
                                                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                                        }`}
                                    >
                                        <CreditCard className="w-4 h-4" />
                                        Credit Card
                                    </button>
                                    <div className="relative flex-1 group">
                                        <button
                                            disabled={isCryptoDisabled}
                                            onClick={() =>
                                                setPaymentMethod("crypto")
                                            }
                                            className={`w-full h-full py-3 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
                                                paymentMethod === "crypto"
                                                    ? "bg-primary text-primary-foreground shadow-md font-bold"
                                                    : isCryptoDisabled
                                                      ? "cursor-not-allowed opacity-50 text-muted-foreground"
                                                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                                            }`}
                                        >
                                            <Wallet className="w-4 h-4" />
                                            Pay with Crypto
                                        </button>
                                        {isCryptoDisabled && (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-popover text-popover-foreground text-xs font-medium rounded-md border border-border shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                                Seller does not accept crypto
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-popover" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Form Container */}
                                <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
                                    <h2 className="text-lg font-bold text-card-foreground mb-6">
                                        Payment Details
                                    </h2>

                                    {paymentMethod === "card" ? (
                                        <form
                                            onSubmit={handleCardPayment}
                                            className="space-y-5"
                                        >
                                            {/* ... CARD INPUTS ... */}
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-muted-foreground uppercase">
                                                    Cardholder Name
                                                </label>
                                                <input
                                                    required
                                                    type="text"
                                                    placeholder="John Doe"
                                                    className="w-full p-3 bg-secondary border border-input rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-muted-foreground uppercase">
                                                    Card Number
                                                </label>
                                                <div className="relative">
                                                    <CreditCard className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                                                    <input
                                                        required
                                                        type="text"
                                                        placeholder="0000 0000 0000 0000"
                                                        className="w-full p-3 pl-10 bg-secondary border border-input rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all font-mono"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-5">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-muted-foreground uppercase">
                                                        Expiry
                                                    </label>
                                                    <input
                                                        required
                                                        type="text"
                                                        placeholder="MM/YY"
                                                        className="w-full p-3 bg-secondary border border-input rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all font-mono"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-muted-foreground uppercase">
                                                        CVC
                                                    </label>
                                                    <input
                                                        required
                                                        type="text"
                                                        placeholder="123"
                                                        className="w-full p-3 bg-secondary border border-input rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all font-mono"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                disabled={isProcessingCard}
                                                className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg mt-4 flex items-center justify-center gap-2 disabled:opacity-70 transition-colors shadow-lg shadow-primary/20"
                                            >
                                                {isProcessingCard ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <ShieldCheck className="w-4 h-4" />
                                                )}
                                                {isProcessingCard
                                                    ? "Processing..."
                                                    : `Pay $${totalUsd.toFixed(2)}`}
                                            </button>
                                        </form>
                                    ) : (
                                        // --- CRYPTO SECTION MODIFIED HERE ---
                                        <div className="flex flex-col items-center justify-center py-8 space-y-6">
                                            <div className="bg-secondary p-4 rounded-full border border-border">
                                                <Image
                                                    src="/ethereum-logo.png"
                                                    width={40}
                                                    height={40}
                                                    alt="ETH"
                                                />
                                            </div>
                                            <div className="text-center space-y-1">
                                                <p className="text-foreground font-medium">
                                                    Sepolia Testnet Payment
                                                </p>
                                                <p className="text-muted-foreground text-sm">
                                                    Send {totalEth} ETH to
                                                    complete purchase
                                                </p>
                                            </div>

                                            {/* --- CONDITIONAL RENDER: CONNECT vs PAY --- */}
                                            <div className="w-full max-w-xs space-y-3">
                                                {!account ? (
                                                    // State 1: Not Connected -> Show Connect Button
                                                    <ConnectButton
                                                        client={client}
                                                        chain={chain}
                                                        theme="dark"
                                                    />
                                                ) : (
                                                    // State 2: Connected -> Show Pay Button + Wallet Info
                                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                        <div className="flex items-center justify-center gap-2 mb-3 text-xs text-muted-foreground bg-secondary/50 py-1.5 px-3 rounded-full w-max mx-auto border border-border">
                                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                            <span>
                                                                Wallet:{" "}
                                                                <span className="font-mono text-foreground">
                                                                    {account.address.slice(
                                                                        0,
                                                                        6,
                                                                    )}
                                                                    ...
                                                                    {account.address.slice(
                                                                        -4,
                                                                    )}
                                                                </span>
                                                            </span>
                                                        </div>

                                                        <button
                                                            onClick={
                                                                handleCryptoPayment
                                                            }
                                                            disabled={
                                                                isTxPending
                                                            }
                                                            className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-70 transition-all shadow-lg shadow-primary/20"
                                                        >
                                                            {isTxPending ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Wallet className="w-4 h-4" />
                                                            )}
                                                            {isTxPending
                                                                ? "Confirming..."
                                                                : "Send Transaction"}
                                                        </button>

                                                        <div className="mt-3 bg-accent/10 border border-accent/20 rounded-lg p-3 text-xs text-accent text-center">
                                                            <strong>
                                                                Note:
                                                            </strong>{" "}
                                                            This uses the
                                                            Sepolia Testnet. Do
                                                            not send real ETH.
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* RIGHT COL: ORDER SUMMARY */}
                    <div className="lg:col-span-1">
                        <div className="bg-card border border-border rounded-xl p-6 shadow-sm sticky top-24">
                            <h3 className="font-bold text-card-foreground mb-4">
                                Order Summary
                            </h3>
                            <div className="flex gap-4 mb-6 pb-6 border-b border-border">
                                <div className="w-16 h-16 bg-secondary rounded-lg overflow-hidden relative border border-border">
                                    <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground text-xs">
                                        IMG
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-medium text-foreground line-clamp-2">
                                        {item.title}
                                    </h4>
                                    <p className="text-muted-foreground text-sm">
                                        Qty: 1
                                    </p>
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
                                <span>
                                    Buyer Protection Guarantee included with
                                    every purchase.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- SUB-COMPONENTS (Keep existing ProcessingView and SuccessView) ---
function ProcessingView({ txHash }: { txHash: string }) {
    return (
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm flex flex-col items-center justify-center min-h-[400px] text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>

            <h2 className="text-xl font-bold text-foreground mb-2">
                Verifying Transaction
            </h2>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                We verified your payment was sent. Now we are waiting for the
                blockchain to confirm it.
            </p>

            {/* Stepper */}
            <div className="w-full max-w-md space-y-4 mb-8">
                {/* Step 1: Sent */}
                <div className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg border border-border">
                    <div className="w-6 h-6 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center shrink-0">
                        <CheckCircle className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-medium text-foreground">
                            Payment Sent
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Transaction broadcasted
                        </p>
                    </div>
                </div>

                {/* Step 2: Processing */}
                <div className="flex items-center gap-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                    <div className="w-6 h-6 text-primary flex items-center justify-center shrink-0">
                        <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-medium text-foreground">
                            Confirming on Sepolia
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Waiting for blocks...
                        </p>
                    </div>
                </div>

                {/* Step 3: Pending */}
                <div className="flex items-center gap-4 p-3 opacity-50">
                    <div className="w-6 h-6 border-2 border-muted-foreground/30 rounded-full shrink-0" />
                    <div className="text-left">
                        <p className="text-sm font-medium text-foreground">
                            Finalizing Order
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Updating inventory
                        </p>
                    </div>
                </div>
            </div>

            {txHash && (
                <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                    View on Explorer <ExternalLink className="w-3 h-3" />
                </a>
            )}

            <div className="mt-8 pt-6 border-t border-border w-full">
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <Clock className="w-3 h-3" />
                    Please keep this window open. This usually takes 15-30
                    seconds.
                </p>
            </div>
        </div>
    );
}

function SuccessView({
    router,
    itemTitle,
}: {
    router: any;
    itemTitle: string;
}) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-md p-8 rounded-2xl shadow-2xl border border-border text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                    Payment Successful!
                </h1>
                <p className="text-muted-foreground mb-8">
                    Your order for{" "}
                    <strong className="text-foreground">{itemTitle}</strong> has
                    been confirmed. The seller has been notified.
                </p>
                <div className="space-y-3">
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group"
                    >
                        Return to Dashboard{" "}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button
                        onClick={() => router.push("/messages")}
                        className="w-full py-3 bg-secondary border border-border text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
                    >
                        Message Seller
                    </button>
                </div>
            </div>
        </div>
    );
}
