import { NextResponse } from "next/server";
import { stripe, type StripeWebhookEvent } from "@/lib/stripe";
import { finalizeCardOrder } from "@/services/orders/internal";

const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
if (!stripeWebhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not defined");
}

export async function POST(request: Request) {
    try {
        const body = await request.text();
        const signature = request.headers.get("stripe-signature") as string;

        if (!signature) {
            console.error("Missing Stripe Signature");
            return new NextResponse("Missing Stripe Signature", {
                status: 400,
            });
        }

        let event: StripeWebhookEvent;

        try {
            event = stripe.webhooks.constructEvent(
                body,
                signature,
                stripeWebhookSecret,
            );
        } catch (error) {
            console.error("Webhook signature verification failed", error);
            return new NextResponse("Webhook signature verification failed", {
                status: 400,
            });
        }

        switch (event.type) {
            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object;
                console.log("Payment Succeeded:", paymentIntent);

                const result = await finalizeCardOrder(paymentIntent.id);

                if (result.success || result.status === "already_processed") {
                    return new NextResponse("Order processed successfully", {
                        status: 200,
                    });
                } else {
                    console.error(
                        "Failed to finalize order logic:",
                        result.status,
                    );

                    if (result.status === "db_error") {
                        // Retry later
                        return new NextResponse("Database Error", {
                            status: 500,
                        });
                    }

                    // logic error: order not found yet??
                    return NextResponse.json({
                        received: true,
                        status: "logic_error",
                    });
                }
            }
            case "payment_intent.payment_failed":
                // Optional: handle failure logic
                break;
            default:
                console.error("Unknown event type:", event.type);
                break;
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Error processing Stripe webhook:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
