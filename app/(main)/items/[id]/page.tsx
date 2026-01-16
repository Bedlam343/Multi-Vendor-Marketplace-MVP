import { getItemById } from "@/data/items";
import ItemDetailView from "@/components/items/ItemDetailView";
import { notFound } from "next/navigation";

export default async function ItemPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const item = await getItemById(id);

    if (!item) {
        notFound();
    }

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <ItemDetailView item={item} />
        </main>
    );
}
