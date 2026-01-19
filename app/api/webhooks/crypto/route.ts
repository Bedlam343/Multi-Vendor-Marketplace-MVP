import { NextResponse } from "next/server";
import { verifyAlchemySignature } from "@/lib/alchemy";
import { finalizeCryptoOrder } from "@/services/orders/internal";

export async function POST(request: Request) {
    try {
        const rawBody = await request.text();
        const signature = request.headers.get("x-alchemy-signature") || "";

        console.log("raw body", rawBody);
        console.log("signature", signature);

        const isValid = verifyAlchemySignature(request, rawBody, signature);
        if (!isValid) {
            return new NextResponse("Invalid Signature", { status: 403 });
        }

        const payload = JSON.parse(rawBody);
        console.log("payload", payload);

        const tx = payload.event?.data?.block?.transactions?.[0];
        console.log("tx", tx);

        if (!tx) {
            console.log("Empty block or heartbeat received");
            return NextResponse.json({ status: "no_activity" });
        }

        // on Ethereum/Sepolia, status 1 = Success, 0 = Reverted/Failed
        if (tx.status === 1) {
            const result = await finalizeCryptoOrder({
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                value: tx.value,
            });

            if (result.success) {
                return NextResponse.json({ success: true, status: "success" });
            }

            console.error("Failed to finalize order:", result);
            return NextResponse.json({ success: false, status: result.status });
        }

        console.log(`Transaction ${tx.hash} failed on-chain. Skipping.`);
        return NextResponse.json({ status: "tx_failed_on_chain" });
    } catch (error) {
        console.error("Crypto webhook error:", error);

        // send 400/500 to tell Alchemy to retry later
        return new NextResponse("Server Error. Try again later.", {
            status: 500,
        });
    }
}
