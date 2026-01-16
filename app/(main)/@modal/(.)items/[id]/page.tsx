import { getItemById } from "@/data/items";
import ItemDetailView from "@/components/items/ItemDetailView";
import Modal from "@/components/layout/Modal";
import { notFound } from "next/navigation";

export default async function ItemModal({
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
        <Modal>
            <ItemDetailView item={item} isModal={true} />
        </Modal>
    );
}
