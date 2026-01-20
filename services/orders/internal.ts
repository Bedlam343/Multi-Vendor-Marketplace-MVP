import { db } from "@/db";
import { orders, items } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatEther } from "viem";

type CryptoTxData = {
    hash: string;
    from: string;
    to: string;
    value: string; // coming from Alchemy as a Wei string
};
export async function finalizeCryptoOrder(txData: CryptoTxData) {
    const existingOrder = await db.query.orders.findFirst({
        where: eq(orders.txHash, txData.hash),
    });

    // --- OPTIONAL: Fetch Seller (If you need to send them an email later) ---
    // If you strictly wanted 2 calls, this is how you do it:
    /*
    const seller = await db.query.user.findFirst({
        where: eq(user.id, existingOrder.sellerId)
    });
    */

    if (existingOrder) {
        if (existingOrder.status === "completed") {
            console.log("Order already completed. Skipping processing.");
            return { success: true, status: "already_processed" };
        }

        // verify the recipient wallet address
        if (
            txData.to.toLowerCase() !==
            existingOrder.sellerWalletAddress?.toLocaleLowerCase()
        ) {
            console.error(
                `Cannot complete order: Recipient crypto wallet address mismatch!`,
            );
            return { success: false, status: "recipient_wallet_mismatch" };
        }

        // verify amount paid
        const amountSent = formatEther(BigInt(txData.value));
        if (amountSent !== existingOrder.amountPaidCrypto) {
            console.error(
                `Cannot complete order: Amount sent does not match order amount!`,
            );
            return { success: false, status: "amount_mismatch" };
        }

        try {
            await db.transaction(async (tx) => {
                await tx
                    .update(orders)
                    .set({ status: "completed" })
                    .where(eq(orders.id, existingOrder.id));
                await tx
                    .update(items)
                    .set({ status: "sold" })
                    .where(eq(items.id, existingOrder.itemId));
            });

            return { success: true, status: "completed" };
        } catch (error) {
            console.error("Error finalizing order:", error);
            return { success: false, status: "db_error" };
        }
    }

    console.error(`⚠️ Unrecognized Hash: ${txData.hash}`);
    return { success: false, status: "no_pending_order" };
}
