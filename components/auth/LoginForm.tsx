"use client";

import { useState, useActionState } from "react";
import Link from "next/link";

import { loginAction } from "@/services/auth-actions";
import { Input } from "@/components/ui/input";

export function LoginForm() {
    const [state, action, isPending] = useActionState(loginAction, undefined);

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    return (
        <form action={action} className="space-y-6">
            {/* Global Error (e.g., Invalid Credentials) */}
            {state?.message && !state.success && (
                <div className="rounded-md bg-red-50 p-4 border border-red-100">
                    <p className="text-sm font-medium text-red-800">
                        {state.message}
                    </p>
                </div>
            )}

            <Input
                id="email"
                name="email"
                type="email"
                label="Email address"
                placeholder="jane@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isPending}
                error={state?.errors?.email}
            />

            <div>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    label="Password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isPending}
                    error={state?.errors?.password}
                />

                <div className="flex justify-end mt-1">
                    <Link
                        href="/forgot-password"
                        className="text-xs font-medium text-accent hover:text-indigo-500"
                    >
                        Forgot your password?
                    </Link>
                </div>
            </div>

            <div>
                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800 disabled:opacity-70 transition-all cursor-pointer"
                >
                    {isPending ? "Signing in..." : "Sign in"}
                </button>
            </div>
        </form>
    );
}
