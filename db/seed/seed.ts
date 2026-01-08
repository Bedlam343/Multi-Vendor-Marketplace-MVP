import { loadEnvConfig } from "@next/env";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../schema";
import data from "./data.json";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

// Helper to generate a random vector of 1536 dimensions
const generateDummyVector = () =>
    Array.from({ length: 1536 }, () => Math.random());

async function main() {
    console.log("🚀 Starting database seed...");

    try {
        // 1. Seed Users
        console.log("👤 Seeding users...");
        await db
            .insert(schema.user)
            .values(
                data.users.map((u) => ({
                    ...u,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }))
            )
            .onConflictDoNothing();

        // 2. Seed Items
        console.log("📦 Seeding items...");
        await db.insert(schema.items).values(
            data.items.map((item) => ({
                ...item,
                embedding: generateDummyVector(), // Required for pgvector
                createdAt: new Date(),
                updatedAt: new Date(),
            }))
        );

        console.log("✅ Seed completed successfully!");
    } catch (error) {
        console.error("❌ Seed failed:", error);
    } finally {
        await pool.end();
    }
}

main();
