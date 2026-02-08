import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import NavbarGuest from "@/components/layout/NavbarGuest";
import NavbarUser from "@/components/layout/NavbarUser";
import { getUnreadMessageCount } from "@/services/chat/queries";

export default async function MainLayout({
    children,
    modal,
}: {
    children: React.ReactNode;
    modal: any;
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const unreadMessageCount = session?.user
        ? await getUnreadMessageCount(session.user.id)
        : 0;

    return (
        <div className="min-h-screen flex flex-col">
            {session?.user ? (
                <NavbarUser
                    user={session.user}
                    unreadMessagesCount={unreadMessageCount}
                />
            ) : (
                <NavbarGuest />
            )}

            <main className="flex-1">{children}</main>

            {modal}
        </div>
    );
}
