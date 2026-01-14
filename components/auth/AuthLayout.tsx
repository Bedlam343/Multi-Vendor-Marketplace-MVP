import Link from "next/link";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
    linkText: string;
    linkHref: string;
}

export async function AuthLayout({
    children,
    title,
    subtitle,
    linkText,
    linkHref,
}: AuthLayoutProps) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (session) {
        redirect("/dashboard");
    }

    return (
        <div
            className="min-h-screen bg-primary-foreground flex flex-col 
            justify-center py-12 sm:px-6 lg:px-8 font-sans"
        >
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                {/* Logo Placeholder */}
                <div
                    className="mx-auto h-10 w-10 bg-primary rounded-lg 
                    flex items-center justify-center text-white font-bold 
                    text-xl"
                >
                    M
                </div>
                <h2
                    className="mt-6 text-center text-3xl font-extrabold 
                    text-primary tracking-tight"
                >
                    {title}
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    {subtitle}{" "}
                    <Link
                        href={linkHref}
                        className="font-medium text-accent hover:text-indigo-500 transition-colors"
                    >
                        {linkText}
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div
                    className="bg-white py-8 px-4 shadow-sm sm:rounded-lg 
                    sm:px-10 border border-border"
                >
                    {children}
                </div>
            </div>
        </div>
    );
}
