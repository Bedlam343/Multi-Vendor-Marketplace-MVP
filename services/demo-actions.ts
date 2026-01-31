"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

export async function loginWithDemoUser() {
    const DEMO_EMAIL = "sarah_buyer@example.com";
    const DEMO_PASSWORD = "Password123!";

    try {
        await auth.api.signInEmail({
            body: {
                email: DEMO_EMAIL,
                password: DEMO_PASSWORD,
            },
        });

        // Revalidate layout to update Navbar state immediately
        revalidatePath("/", "layout");
    } catch (error) {
        console.error("Demo login failed:", error);
        return { success: false, error: "Failed to login with demo user." };
    }

    return { success: true };
}
