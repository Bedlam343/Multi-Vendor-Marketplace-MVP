import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import CreateItemForm from "@/components/items/CreateItemForm";
import { headers } from "next/headers";

export const metadata = {
    title: "Sell an Item | Marketplace",
};

export default async function CreateItemPage() {
    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            {/* Title text moved inside the form component for better control */}
            <CreateItemForm />
        </div>
    );
}
