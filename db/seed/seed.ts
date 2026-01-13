import { loadEnvConfig } from "@next/env";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../schema";
import data from "./data.json";
import { auth } from "@/lib/auth";
import { sql } from "drizzle-orm";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

// Helper to generate a random vector
const generateDummyVector = () =>
    Array.from({ length: 1536 }, () => Math.random());

async function clearDatabase() {
    console.log("🗑️  Emptying existing data...");
    // Include all new tables in the truncate
    await db.execute(
        sql`TRUNCATE TABLE "orders", "messages", "items", "account", "session", "user" RESTART IDENTITY CASCADE;`
    );
}

async function main() {
    console.log("🚀 Starting database seed...");

    try {
        await clearDatabase();

        // --- 1. Seed Users ---
        console.log("👤 Creating users...");
        const userMap: Record<string, string> = {};

        for (const u of data.users) {
            try {
                // Using Better Auth to create the user properly (hashing passwords, etc)
                const res = await auth.api.signUpEmail({
                    body: {
                        email: u.email,
                        password: u.password,
                        name: u.name,
                        image: u.image,
                    },
                });

                if (res?.user?.id) {
                    userMap[u.id] = res.user.id;
                }
            } catch (err) {
                console.warn(`⚠️  Failed to create user ${u.email}:`, err);
            }
        }

        // --- 2. Seed Items ---
        console.log("📦 Seeding items...");
        const itemMap: Record<string, string> = {};

        // We loop so we can capture the specific ID for each item
        for (const item of data.items) {
            const [insertedItem] = await db
                .insert(schema.items)
                .values({
                    sellerId: userMap[item.sellerId], // Link to real User ID
                    title: item.title,
                    description: item.description,
                    price: item.price,
                    condition: item.condition as any,
                    status: item.status as any,
                    images: item.images,
                    embedding: generateDummyVector(),
                })
                .returning({ id: schema.items.id });

            // Map the JSON ID (item_1) to Real DB ID (uuid...)
            itemMap[item.id] = insertedItem.id;
        }

        // --- 3. Seed Orders ---
        console.log("💰 Seeding orders...");
        if (data.orders && data.orders.length > 0) {
            await db.insert(schema.orders).values(
                data.orders.map((order) => ({
                    itemId: itemMap[order.itemId], // Real Item UUID
                    buyerId: userMap[order.buyerId], // Real Buyer UUID
                    sellerId: userMap[order.sellerId], // Real Seller UUID
                    amountPaid: order.amountPaid,
                    status: order.status as any,
                }))
            );
        }

        // --- Cleanup ---
        console.log("🧹 Cleaning up seeder sessions...");
        await db.delete(schema.session);

        console.log("✅ Seed completed successfully!");
        console.log(`   - Users created: ${Object.keys(userMap).length}`);
        console.log(`   - Items created: ${Object.keys(itemMap).length}`);
        console.log(`   - Orders created: ${data.orders.length}`);
    } catch (error) {
        console.error("❌ Seed failed:", error);
    } finally {
        await pool.end();
    }
}

main();
