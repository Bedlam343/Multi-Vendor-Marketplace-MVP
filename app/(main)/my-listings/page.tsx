import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Plus } from "lucide-react";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { getItems } from "@/data/items";
import MyListings from "@/components/dashboard/MyListings";

export const metadata = {
    title: "My Listings | Marketplace",
};

export default async function MyListingsPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) return redirect("/login");

    // Fetch ALL items for this seller initially
    // We pass the sellerId so the backend knows to fetch this user's data
    const { data: initialItems, pagination } = await getItems({
        sellerId: session.user.id,
        page: 1,
        limit: 12,
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">
                        My Listings
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your inventory and track your sales history.
                    </p>
                </div>
                <Link
                    href="/create-item"
                    className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    New Listing
                </Link>
            </div>

            <MyListings
                initialItems={initialItems}
                initialPagination={pagination}
                userId={session.user.id}
            />
        </div>
    );
}
