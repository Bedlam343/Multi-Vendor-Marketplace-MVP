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
            {/* Global Error */}
            {state?.message && !state.success && (
                <div className="rounded-lg bg-destructive/10 p-4 border border-destructive/20">
                    <p className="text-sm font-medium text-destructive">
                        {state.message}
                    </p>
                </div>
            )}

            <Input
                id="email"
                name="email"
                type="email"
                label="Email address"
                labelColor="text-muted-foreground"
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
                    labelColor="text-muted-foreground"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isPending}
                    error={state?.errors?.password}
                />

                <div className="flex justify-end mt-2">
                    <Link
                        onClick={() =>
                            alert("Forgot password feature coming soon!")
                        }
                        href="#"
                        className="text-xs font-medium text-accent hover:text-accent/80 transition-colors"
                    >
                        Forgot your password?
                    </Link>
                </div>
            </div>

            <div>
                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                >
                    {isPending ? "Signing in..." : "Sign in"}
                </button>
            </div>
        </form>
    );
}
