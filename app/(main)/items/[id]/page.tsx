import { notFound } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { getItemById } from "@/data/items";
import PublicItemView from "@/components/items/PublicItemView";
import OwnerItemView from "@/components/items/OwnerItemView";

export default async function ItemPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    const item = await getItemById(id);

    if (!item) {
        notFound();
    }

    const isOwner = session?.user?.id === item.seller?.id;

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {isOwner ? (
                <OwnerItemView item={item} />
            ) : (
                <PublicItemView item={item} />
            )}
        </main>
    );
}
