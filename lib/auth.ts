import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg", // PostgreSQL
        schema: {
            ...schema,
            // Better Auth looks for 'user' and 'session' specifically
            user: schema.user,
            session: schema.session,
            account: schema.account,
        },
    }),
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
    },
    plugins: [nextCookies()], // auto-manage cookies in Next.js
});
