"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { stripe, type StripePaymentMethod } from "@/lib/stripe";
import { orders, items, user } from "@/db/schema";
import { authenticatedAction } from "@/lib/safe-action";
import {
    type CreatePendingCardOrderInput,
    createPendingCryptoOrderSchema,
    type CreatePendingCryptoOrderInput,
} from "@/db/validation";
import { DEFAULT_SHIPPING_COST, SEPOLIA_CHAIN_ID } from "@/utils/constants";

export async function createPendingCryptoOrder(
    data: CreatePendingCryptoOrderInput,
) {
    return authenticatedAction(data, async (txData, session) => {
        const validatedData = createPendingCryptoOrderSchema.safeParse(txData);
        if (!validatedData.success) {
            return {
                success: false,
                errors: z.flattenError(validatedData.error).fieldErrors,
                data: null,
            };
        }

        // fetch the item
        const item = await db.query.items.findFirst({
            where: eq(items.id, data.itemId),
        });
        if (!item)
            return { success: false, message: "Item not found", data: null };

        if (item.sellerId === session.user.id) {
            return {
                success: false,
                message: "You cannot purchase your own item.",
                data: null,
            };
        }

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
                data: {
                    orderId,
                },
                message: "Order created successfully",
            };
        } catch (error) {
            console.error("Error creating order:", error);
            return {
                success: false,
                message: "An error occurred while creating the order.",
                data: null,
            };
        }
    });
}

export async function createPendingCardOrder(
    input: CreatePendingCardOrderInput,
) {
    return authenticatedAction(input, async ({ stripePaymentId }, session) => {
        try {
            console.log(
                "Creating pending card order for payment intent:",
                stripePaymentId,
            );
            const paymentIntent = await stripe.paymentIntents.retrieve(
                stripePaymentId,
                {
                    expand: ["payment_method"],
                },
            );

            if (paymentIntent.status !== "succeeded") {
                return {
                    success: false,
                    message: "Payment intent status is not succeeded",
                    data: null,
                };
            }

            const itemId = paymentIntent.metadata.itemId;
            if (!itemId) {
                console.error("Item ID not found in payment intent metadata");
                return {
                    success: false,
                    message: "Invalid payment record.",
                    data: null,
                };
            }

            // fetch item (source of truth)
            const item = await db.query.items.findFirst({
                where: eq(items.id, itemId),
            });

            if (!item) return { success: false, message: "Item not found." };

            if (item.sellerId === session.user.id) {
                return {
                    success: false,
                    message: "You cannot purchase your own item.",
                    data: null,
                };
            }

            // TO DO: implement the refund if oversell
            if (item.status !== "available") {
                console.error(
                    `🚨 OVERSELL ALERT: Item ${itemId} paid for by ${session.user.id} but status is ${item.status}`,
                );

                return {
                    success: false,
                    message:
                        "This item was just purchased by someone else. A refund will be processed automatically.",
                    data: null,
                };
            }

            const expectedAmount = Math.round((Number(item.price) + 8.0) * 100);
            if (paymentIntent.amount !== expectedAmount) {
                return {
                    success: false,
                    message: "Payment amount mismatch.",
                };
            }

            const paymentMethod =
                paymentIntent.payment_method as StripePaymentMethod;
            const cardBrand = paymentMethod?.card?.brand || "Unknown";
            const cardLast4 = paymentMethod?.card?.last4 || "????";

            const orderId = await db.transaction(async (tx) => {
                // Re-verify status INSIDE the transaction for absolute safety (Atomic check)
                const [latestItem] = await tx
                    .select()
                    .from(items)
                    .where(eq(items.id, itemId))
                    .limit(1);

                // triggers rollback
                if (latestItem.status !== "available") {
                    throw new Error("item_already_sold");
                }

                const [newOrder] = await tx
                    .insert(orders)
                    .values({
                        itemId: item.id,
                        buyerId: session.user.id,
                        sellerId: item.sellerId,
                        status: "pending",
                        paymentMethod: "card",
                        stripePaymentIntentId: paymentIntent.id,
                        amountPaidUsd: (paymentIntent.amount / 100).toFixed(2),
                        cardBrand: cardBrand as any,
                        cardLast4: cardLast4,
                    })
                    .returning({ id: orders.id });

                await tx
                    .update(items)
                    .set({ status: "reserved" })
                    .where(eq(items.id, itemId));

                return newOrder.id;
            });

            console.log("Pending card order created successfully", orderId);

            return {
                success: true,
                message: "Order created successfully",
                data: {
                    orderId,
                },
            };
        } catch (error) {
            console.error("Error creating order:", error);

            if (
                error instanceof Error &&
                error.message === "item_already_sold"
            ) {
                return {
                    success: false,
                    message:
                        "This item was just purchased by someone else. A refund will be processed automatically.",
                    data: null,
                };
            }

            return {
                success: false,
                message: "An error occurred while creating the order.",
                data: null,
            };
        }
    });
}

export async function createStripePaymentIntent(itemId: string) {
    return authenticatedAction(itemId, async (id, session) => {
        const item = await db.query.items.findFirst({
            where: eq(items.id, id),
        });

        if (!item) {
            return {
                success: false,
                message: "Item not found",
                data: null,
            };
        }

        if (item.sellerId === session.user.id) {
            return {
                success: false,
                message: "You cannot purchase your own item.",
                data: null,
            };
        }

        if (item.status !== "available") {
            return {
                success: false,
                message: "Item is no longer available",
                data: null,
            };
        }

        const itemPriceCents = Math.round(Number(item.price) * 100);
        const shippingCents = DEFAULT_SHIPPING_COST;
        const totalAmountCents = itemPriceCents + shippingCents;

        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: totalAmountCents,
                currency: "usd",
                automatic_payment_methods: { enabled: true },
                // metadata (useful for debugging webhooks later)
                metadata: {
                    itemId: item.id,
                    buyerId: session.user.id,
                    sellerId: item.sellerId,
                },
            });

            return {
                success: true,
                data: {
                    id: paymentIntent.id,
                    clientSecret: paymentIntent.client_secret,
                },
                message: "Payment intent created successfully",
            };
        } catch (error) {
            console.error("Error creating stripe payment intent", error);

            return {
                success: false,
                message: "Failed to initialize payment",
                data: null,
            };
        }
    });
}

export async function checkOrderStatus(orderId: string) {
    return authenticatedAction(orderId, async (id, session) => {
        try {
            const order = await db.query.orders.findFirst({
                where: eq(orders.id, id),
            });

            if (!order) {
                return {
                    success: false,

                    message: "Order not found",
                    data: {
                        status: "failed",
                    },
                };
            }

            // Ensure only the buyer or seller can check the status
            if (
                order.buyerId !== session.user.id &&
                order.sellerId !== session.user.id
            ) {
                return {
                    success: false,
                    message: "Unauthorized",
                    data: {
                        status: "failed",
                    },
                };
            }

            // Map DB status to component expectations if needed
            // The component expects "completed" or "failed"
            let status = order.status;
            if (order.status === "cancelled" || order.status === "refunded") {
                status = "failed" as any;
            }

            return {
                success: true,
                message: "Order status checked successfully",
                data: {
                    status,
                },
            };
        } catch (error) {
            console.error("Error checking order status:", error);
            return {
                success: false,
                message: "An error occurred while checking the order status.",
                data: {
                    status: "failed",
                },
            };
        }
    });
}

export async function debugSimulateWebhook(orderId: string) {
    if (process.env.NODE_ENV === "production") return; // Safety

    await db
        .update(orders)
        .set({ status: "completed" })
        .where(eq(orders.id, orderId));

    // Also update item if needed, though usually just testing the UI flow
    const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
    });
    if (order) {
        await db
            .update(items)
            .set({ status: "sold" })
            .where(eq(items.id, order.itemId));
    }
    return { success: true };
}
