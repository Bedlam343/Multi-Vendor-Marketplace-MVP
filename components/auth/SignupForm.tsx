"use client";

import { useState, useActionState, useTransition } from "react";
import { z } from "zod";
import { signupAction } from "@/services/auth-actions";
import { insertUserSchema, type SignupFieldErrors } from "@/db/validation";

import { Input } from "@/components/ui/input";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { PasswordMatch } from "./PasswordMatch";

export function SignupForm() {
    // useActionState handles the server response
    const [state, action, isPending] = useActionState(signupAction, undefined);
    const [isSubmitting, startTransition] = useTransition();

    const [clientErrors, setClientErrors] = useState<SignupFieldErrors>({});

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));

        // Clear specific error when user starts typing again
        if (clientErrors[e.target.name as keyof SignupFieldErrors]) {
            setClientErrors((prev) => ({
                ...prev,
                [e.target.name]: undefined,
            }));
        }
    };

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setClientErrors({}); // Reset client errors

        const payload = new FormData(event.currentTarget);
        const rawData = Object.fromEntries(payload.entries());

        // Run Zod on the client
        const result = insertUserSchema.safeParse(rawData);

        if (!result.success) {
            // If Zod fails, set local errors and STOP the submission
            const formattedErrors = z.flattenError(result.error).fieldErrors;
            setClientErrors(formattedErrors);
            return;
        }

        // If Zod passes, call the Server Action manually
        startTransition(() => {
            action(payload);
        });
    }

    // Merge errors: Priority to clientErrors, fallback to server state errors
    const errors = { ...state?.errors, ...clientErrors };

    const currentlySubmitting = isPending || isSubmitting;

    return (
        /* 4. Use onSubmit instead of action for manual control */
        <form onSubmit={handleSubmit} className="space-y-6">
            {state?.message && !state.success && (
                <div className="rounded-md bg-red-50 p-4 border border-red-100">
                    <p className="text-sm font-medium text-red-800">
                        {state.message}
                    </p>
                </div>
            )}

            <Input
                id="name"
                name="name"
                label="Full Name"
                placeholder="Jane Doe"
                value={formData.name}
                onChange={handleChange}
                disabled={currentlySubmitting}
                error={errors.name}
            />

            <Input
                id="email"
                name="email"
                type="email"
                label="Email address"
                placeholder="jane@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={currentlySubmitting}
                error={errors.email}
            />

            <Input
                id="password"
                name="password"
                type="password"
                label="Password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={currentlySubmitting}
                error={errors.password}
            />

            <PasswordRequirements value={formData.password} />

            <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                label="Confirm Password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={currentlySubmitting}
                error={errors.confirmPassword}
            />

            <PasswordMatch
                password={formData.password}
                confirm={formData.confirmPassword}
            />

            <div>
                <button
                    type="submit"
                    disabled={currentlySubmitting}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800 disabled:opacity-70 transition-all cursor-pointer"
                >
                    {currentlySubmitting ? "Validating..." : "Create account"}
                </button>
            </div>
        </form>
    );
}
