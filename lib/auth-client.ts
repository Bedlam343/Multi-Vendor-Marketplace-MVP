import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
});

export type BetterAuthErrorTypes = Partial<
    Record<keyof typeof authClient.$ERROR_CODES, { message: string }>
>;

export const betterAuthErrorCodes = {
    USER_ALREADY_EXISTS: {
        message: "A user with this email already exists.",
    },
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: {
        message:
            "A user with this email already exists. Please use another one.",
    },
    INVALID_EMAIL_OR_PASSWORD: {
        message: "Incorrect email or password. Please try again.",
    },
    SESSION_EXPIRED: {
        message: "Your session has expired. Please log in again.",
    },
    PASSWORD_TOO_SHORT: {
        message: "Password must be at least 8 characters long.",
    },
} satisfies BetterAuthErrorTypes;

export const { signIn, signUp, useSession, signOut } = authClient;
