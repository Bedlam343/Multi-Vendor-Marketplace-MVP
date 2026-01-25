import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import NavbarGuest from "@/components/layout/NavbarGuest";
import NavbarUser from "@/components/layout/NavbarUser";

export default async function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return (
        <div className="min-h-screen flex flex-col">
            {session?.user ? (
                <NavbarUser user={session.user} />
            ) : (
                <NavbarGuest />
            )}

            <main className="flex-1">{children}</main>
        </div>
    );
}
