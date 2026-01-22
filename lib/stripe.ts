import "server-only";

import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
    throw new Error("Stripe secret key not found");
}

export const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-12-15.clover",
    typescript: true,
});

export type StripePaymentMethod = Stripe.PaymentMethod;
export type StripeWebhookEvent = Stripe.Event;
