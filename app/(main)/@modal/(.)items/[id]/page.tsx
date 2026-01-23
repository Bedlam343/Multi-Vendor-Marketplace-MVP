import { notFound } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { getItemById } from "@/data/items";
import PublicItemView from "@/components/items/PublicItemView";
import OwnerItemView from "@/components/items/OwnerItemView";
import Modal from "@/components/layout/Modal";

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

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const isOwner = session?.user?.id === item.seller?.id;

    return (
        <Modal>
            {isOwner ? (
                <OwnerItemView item={item} isModal={true} />
            ) : (
                <PublicItemView item={item} isModal={true} />
            )}
        </Modal>
    );
}
