import "server-only";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

type AuthenticatedActionLogic<T, R> = (
    data: T,
    session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>,
) => Promise<R>;

export async function authenticatedAction<T, R>(
    data: T,
    logic: AuthenticatedActionLogic<T, R>,
): Promise<R | { success: boolean; message: string; data: null }> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return {
            success: false,
            message: "Unauthorized. Please log in.",
            data: null,
        };
    }

    return logic(data, session);
}
