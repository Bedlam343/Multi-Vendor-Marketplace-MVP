import { loadEnvConfig } from "@next/env";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../schema";
import data from "./data.json"; // Your source data
import { auth } from "@/lib/auth";
import { sql, eq } from "drizzle-orm";
import { generateEmbedding } from "@/lib/openai"; // Update path as needed
import fs from "fs";
import path from "path";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

// Helper to write back to JSON file
const saveEmbeddingsToDisk = (updatedData: typeof data) => {
    const filePath = path.join(process.cwd(), "db/seed/data.json");
    try {
        fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));
        console.log("💾 Updated data.json with new embeddings.");
    } catch (error) {
        console.error("❌ Failed to write to data.json:", error);
    }
};

async function clearDatabase() {
    console.log("🗑️  Emptying existing data...");
    await db.execute(
        sql`TRUNCATE TABLE "orders", "messages", "items", "account", "session", "user" RESTART IDENTITY CASCADE;`,
    );
}

async function main() {
    console.log("🚀 Starting database seed...");
    let dataModified = false;

    try {
        await clearDatabase();

        // --- 1. Seed Users ---
        console.log("👤 Creating users...");
        const userMap: Record<string, string> = {};

        for (const u of data.users) {
            try {
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
                    await db
                        .update(schema.user)
                        .set({
                            cryptoWalletAddress: u.cryptoWalletAddress,
                            stripeCustomerId: u.stripeCustomerId,
                            savedCardBrand: u.savedCardBrand,
                            savedCardLast4: u.savedCardLast4,
                        })
                        .where(eq(schema.user.id, res.user.id));
                }
            } catch (err) {
                console.warn(`⚠️  Failed to create user ${u.email}:`, err);
            }
        }

        // --- 2. Seed Items (With Cached Embeddings) ---
        console.log("📦 Seeding items...");
        const itemMap: Record<string, string> = {};

        for (const [index, item] of data.items.entries()) {
            const currentItem = item as any; // Cast to allow adding 'embedding' property if strict TS blocks it

            // 1. Check if embedding already exists in JSON
            if (!currentItem.embedding || currentItem.embedding.length === 0) {
                console.log(
                    `   ✨ Generating NEW embedding for: "${item.title}"`,
                );

                const textToEmbed = `${item.title} ${item.description}`;
                try {
                    const embedding = await generateEmbedding(textToEmbed);
                    currentItem.embedding = embedding; // Update the in-memory object
                    dataModified = true; // Mark flag to save to disk later
                } catch (error) {
                    console.error(
                        `   ❌ API Error for "${item.title}". Skipping embedding.`,
                    );
                    currentItem.embedding = new Array(1536).fill(0); // Fallback
                }
            } else {
                console.log(
                    `   ⏩ Using CACHED embedding for: "${item.title}"`,
                );
            }

            // 2. Insert into DB using the embedding (either cached or new)
            const [insertedItem] = await db
                .insert(schema.items)
                .values({
                    sellerId: userMap[item.sellerId],
                    title: item.title,
                    description: item.description,
                    price: item.price,
                    condition: item.condition as any,
                    status: item.status as any,
                    images: item.images,
                    embedding: currentItem.embedding,
                })
                .returning({ id: schema.items.id });

            itemMap[item.id] = insertedItem.id;
        }

        // --- 3. Save Cache ---
        if (dataModified) {
            saveEmbeddingsToDisk(data);
        } else {
            console.log(
                "no new embeddings generated, skipping write to data.json",
            );
        }

        // --- Cleanup ---
        console.log("🧹 Cleaning up seeder sessions...");
        await db.delete(schema.session);

        console.log("✅ Seed completed successfully!");
    } catch (error) {
        console.error("❌ Seed failed:", error);
    } finally {
        await pool.end();
    }
}

main();
