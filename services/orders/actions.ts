"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { orders, items, user } from "@/db/schema";
import { authenticatedAction } from "@/lib/safe-action";
import {
    createPendingCryptoOrderSchema,
    type CreatePendingCryptoOrderInput,
} from "@/db/validation";
import { SEPOLIA_CHAIN_ID } from "@/utils/constants";

export async function createPendingCryptoOrder(
    data: CreatePendingCryptoOrderInput,
) {
    return authenticatedAction(data, async (txData, session) => {
        const validatedData = createPendingCryptoOrderSchema.safeParse(txData);
        if (!validatedData.success) {
            return {
                success: false,
                errors: z.flattenError(validatedData.error).fieldErrors,
            };
        }

        // fetch the item
        const item = await db.query.items.findFirst({
            where: eq(items.id, data.itemId),
        });
        if (!item) return { success: false, message: "Item not found" };

        // fetch the seller
        const seller = await db.query.user.findFirst({
            where: eq(user.id, item.sellerId),
        });
        if (!seller || !seller.cryptoWalletAddress) {
            return { success: false, message: "Seller wallet not configured" };
        }

        try {
            // transaction: all or nothing. treats every query as part of the same transaction
            const orderId = await db.transaction(async (tx) => {
                // create the order as "pending"
                const [newOrder] = await tx
                    .insert(orders)
                    .values({
                        ...validatedData.data,
                        buyerId: session.user.id,
                        status: "pending",
                        paymentMethod: "crypto",
                        chainId: SEPOLIA_CHAIN_ID,
                        sellerWalletAddress: seller.cryptoWalletAddress!,
                        sellerId: seller.id,
                    })
                    .returning({ id: orders.id });

                // mark the item as "reserved"
                await tx
                    .update(items)
                    .set({
                        status: "reserved",
                    })
                    .where(eq(items.id, validatedData.data.itemId));

                return newOrder.id;
            });

            return {
                success: true,
                orderId,
            };
        } catch (error) {
            console.error("Error creating order:", error);
            return {
                success: false,
                message: "An error occurred while creating the order.",
            };
        }
    });
}

export async function checkOrderStatus(orderId: string) {}
