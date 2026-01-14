import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function LoginPage() {
    // Redirect to dashboard if already logged in
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (session) {
        redirect("/dashboard");
    }

    return (
        <AuthLayout
            title="Welcome back"
            subtitle="New to the marketplace?"
            linkText="Create an account"
            linkHref="/signup"
        >
            <LoginForm />
        </AuthLayout>
    );
}
