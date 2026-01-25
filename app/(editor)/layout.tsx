import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import EditorNavbar from "@/components/items/EditorNavbar";

export default async function EditorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) return redirect("/login");

    return (
        <div className="min-h-screen bg-background">
            <Suspense fallback={null}>
                <EditorNavbar />
            </Suspense>
            <main>{children}</main>
        </div>
    );
}
