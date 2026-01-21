import { Loader2, CheckCircle, ExternalLink, Clock } from "lucide-react";

type ProcessingMode = "crypto" | "card";

interface ProcessingViewProps {
    step: number;
    mode: ProcessingMode;
    txHash?: string;
}

export default function ProcessingView({
    step,
    mode,
    txHash,
}: ProcessingViewProps) {
    // 1. Define Content Configuration
    const stepsConfig = {
        crypto: [
            { label: "Payment Sent", sub: "Transaction broadcasted" },
            { label: "Confirming on Sepolia", sub: "Waiting for blocks..." },
            { label: "Finalizing Order", sub: "Updating inventory" },
        ],
        card: [
            { label: "Payment Authorized", sub: "Securely transmitted" },
            { label: "Verifying Payment", sub: "Communicating with Stripe..." },
            { label: "Finalizing Order", sub: "Updating inventory" },
        ],
    };

    const currentSteps = stepsConfig[mode];

    // 2. Helper for visual states
    const getStepClass = (stepNum: number) => {
        // DONE
        if (step > stepNum)
            return "opacity-50 grayscale transition-all duration-500";
        // ACTIVE (The Pop)
        if (step === stepNum)
            return "opacity-100 border-2 border-primary bg-primary/10 shadow-lg scale-105 transition-all duration-300 ring-2 ring-primary/20";
        // FUTURE
        return "opacity-30 grayscale transition-all duration-500";
    };

    return (
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm flex flex-col items-center justify-center min-h-[400px] text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>

            <h2 className="text-xl font-bold text-foreground mb-2">
                Processing Order
            </h2>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                Please wait while we verify your transaction
                {mode === "crypto" ? " on the blockchain." : " securely."}
            </p>

            {/* Dynamic Stepper */}
            <div className="w-full max-w-md space-y-4 mb-8">
                {currentSteps.map((s, index) => {
                    const stepNum = index + 1;
                    return (
                        <div
                            key={stepNum}
                            className={`flex items-center gap-4 p-4 rounded-lg border border-border ${getStepClass(stepNum)}`}
                        >
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                    step > stepNum || step === stepNum
                                        ? step === stepNum // Active Step
                                            ? "text-primary bg-secondary"
                                            : "bg-green-500/20 text-green-500" // Completed Steps
                                        : "text-primary bg-secondary" // Future Steps
                                }`}
                            >
                                {step > stepNum ? (
                                    <CheckCircle className="w-5 h-5" />
                                ) : step === stepNum ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <div className="w-2 h-2 bg-current rounded-full" />
                                )}
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-foreground">
                                    {s.label}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {s.sub}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Explorer Link (Only for Crypto) */}
            {mode === "crypto" && txHash && !txHash.startsWith("0xMOCK") && (
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
                    <Clock className="w-3 h-3" /> Do not close this window.
                </p>
            </div>
        </div>
    );
}
