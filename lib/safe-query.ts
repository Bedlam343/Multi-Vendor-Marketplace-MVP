import "server-only";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type AuthenticatedQueryLogic<T, R> = (
    data: T,
    session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>,
) => Promise<R>;

export async function authenticatedQuery<T, R>(
    data: T,
    logic: AuthenticatedQueryLogic<T, R>,
): Promise<R> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    return logic(data, session);
}