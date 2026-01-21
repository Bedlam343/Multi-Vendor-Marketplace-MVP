"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Wallet, Loader2 } from "lucide-react";

import {
    createThirdwebClient,
    defineChain,
    prepareTransaction,
    toWei,
} from "thirdweb";
import {
    ConnectButton,
    useActiveAccount,
    useSendTransaction,
} from "thirdweb/react";

import {
    createPendingCryptoOrder,
    debugSimulateWebhook,
} from "@/services/orders/actions";
import { getEthPriceInUsd } from "@/utils/helpers";
import { SEPOLIA_CHAIN_ID, DEFAULT_SHIPPING_COST } from "@/utils/constants";
import { ItemWithSellerWallet } from "@/data/items";
import { NonNullBuyer } from "@/data/user";

const thirdWebClientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
if (!thirdWebClientId) throw new Error("Thirdweb Client ID not found");

const client = createThirdwebClient({ clientId: thirdWebClientId });
const chain = defineChain(SEPOLIA_CHAIN_ID);

type CryptoPaymentFormProps = {
    isMockMode: boolean;
    item: ItemWithSellerWallet;
    buyer: NonNullBuyer;
    onTxSent: (txHash: string) => void;
    onOrderCreated: (orderId: string) => void;
};

export default function CryptoPaymentForm({
    isMockMode,
    item,
    buyer,
    onTxSent,
    onOrderCreated,
}: CryptoPaymentFormProps) {
    const [ethPrice, setEthPrice] = useState<number | null>(null);
    const [isFetchingPrice, setIsFetchingPrice] = useState(true);

    // Costs
    const shippingCost = DEFAULT_SHIPPING_COST;
    const totalUsd = Number(item.price) + shippingCost;
    const totalEth = ethPrice ? (totalUsd / ethPrice).toFixed(6) : "0.00";

    const account = useActiveAccount();
    const { mutate: sendTransaction, isPending: isTxPending } =
        useSendTransaction();

    useEffect(() => {
        getEthPriceInUsd().then((price) => {
            setEthPrice(price);
            setIsFetchingPrice(false);
        });
    }, []);

    // Handlers (Moved from parent)
    const handleCryptoPayment = () => {
        if (!account) return alert("Connect wallet first");
        if (!item.seller?.cryptoWalletAddress) return alert("No seller wallet");

        const transaction = prepareTransaction({
            to: item.seller.cryptoWalletAddress,
            chain,
            client,
            value: toWei(totalEth.toString()),
        });

        sendTransaction(transaction, {
            onSuccess: async (txResult) => {
                onTxSent(txResult.transactionHash); // Notify parent to change view

                const result = await createPendingCryptoOrder({
                    itemId: item.id,
                    amountPaidCrypto: totalEth,
                    amountPaidUsd: String(totalUsd),
                    txHash: txResult.transactionHash,
                    buyerWalletAddress: account.address,
                });

                if (result.success && result.data) {
                    onOrderCreated(result.data.orderId); // Notify parent to start polling
                }
            },
            onError: (err) => console.error(err),
        });
    };

    // Keep Mock logic for testing
    const handleMockPayment = async () => {
        const mockHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
        onTxSent(mockHash);

        const result = await createPendingCryptoOrder({
            itemId: item.id,
            amountPaidCrypto: totalEth,
            amountPaidUsd: String(totalUsd),
            txHash: mockHash,
            buyerWalletAddress: account?.address || "0xMock",
        });

        if (result.success && result.data) {
            const oid = result.data.orderId;
            onOrderCreated(oid);
            setTimeout(() => debugSimulateWebhook(oid), 4000);
        }
    };

    return (
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm text-center space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="bg-secondary p-4 rounded-full border border-border inline-block">
                <Image
                    src="/ethereum-logo.png"
                    width={40}
                    height={40}
                    alt="ETH"
                />
            </div>
            <div>
                <p className="text-foreground font-medium">
                    Sepolia Testnet Payment
                </p>
                <p className="text-muted-foreground text-sm">
                    {isFetchingPrice
                        ? "Fetching price..."
                        : `Send ${totalEth} ETH`}
                </p>
            </div>

            <div className="max-w-xs mx-auto space-y-3">
                {!account ? (
                    <ConnectButton client={client} chain={chain} theme="dark" />
                ) : (
                    <>
                        <button
                            onClick={
                                isMockMode
                                    ? handleMockPayment
                                    : handleCryptoPayment
                            }
                            disabled={!isMockMode && isTxPending}
                            className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
                        >
                            {!isMockMode && isTxPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Wallet className="w-4 h-4" />
                            )}
                            {isMockMode
                                ? "Pay (Mock)"
                                : isTxPending
                                  ? "Confirming..."
                                  : "Send Transaction"}
                        </button>
                        <p className="text-xs text-muted-foreground">
                            Testnet only. Do not send real ETH.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
