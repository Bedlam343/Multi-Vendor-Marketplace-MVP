import { CreditCard, Wallet } from "lucide-react";

type PaymentSelectorProps = {
    onSelectCard: () => void;
    onSelectCrypto: () => void;
    isCryptoDisabled: boolean;
};

export default function PaymentSelector({
    onSelectCard,
    onSelectCrypto,
    isCryptoDisabled,
}: PaymentSelectorProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-foreground">
                Select Payment Method
            </h2>
            <div className="grid grid-cols-1 gap-4">
                <button
                    onClick={onSelectCard}
                    className="flex items-center justify-between p-6 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group text-left"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-bold text-foreground">
                                Credit or Debit Card
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Secure checkout via Stripe
                            </p>
                        </div>
                    </div>
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 group-hover:border-primary group-hover:bg-primary/20" />
                </button>

                <button
                    onClick={onSelectCrypto}
                    disabled={isCryptoDisabled}
                    className={`flex items-center justify-between p-6 bg-card border border-border rounded-xl transition-all group text-left ${isCryptoDisabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary/50 hover:shadow-md"}`}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-secondary text-foreground rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-bold text-foreground">
                                Cryptocurrency
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Pay with ETH on Sepolia
                            </p>
                        </div>
                    </div>
                    {isCryptoDisabled ? (
                        <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded">
                            Unavailable
                        </span>
                    ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 group-hover:border-primary group-hover:bg-primary/20" />
                    )}
                </button>
            </div>
        </div>
    );
}
