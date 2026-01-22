import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import CreateItemForm from "@/components/items/CreateItemForm";

export const metadata = {
    title: "Sell an Item | Marketplace",
};

export default async function CreateItemPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session?.user) return redirect("/login");

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <div className="mb-8 space-y-2 animate-in fade-in slide-in-from-left-4 duration-500">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    What are you selling?
                </h1>
                <p className="text-muted-foreground">
                    Provide details about your item to help buyers find it.
                </p>
            </div>

            <CreateItemForm />
        </div>
    );
}
