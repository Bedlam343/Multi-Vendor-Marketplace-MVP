import { loadEnvConfig } from "@next/env";
const projectDir = process.cwd();
loadEnvConfig(projectDir);

import { Storage } from "@google-cloud/storage";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { faker } from "@faker-js/faker";

import * as schema from "../schema";
import { GCS_DOMAIN } from "@/utils/constants";

const TARGET_ITEMS = 500;

export const storage = new Storage({ keyFilename: "gs-service-account.json" });

export const BUCKET_NAME = process.env.GCP_BUCKET_NAME!;
export const LISTING_IMAGES_DIR = process.env.GCP_LISTING_IMAGES_DIR!;

if (!BUCKET_NAME || !LISTING_IMAGES_DIR) {
    throw new Error("GCP_BUCKET_NAME or GCP_LISTING_IMAGES_DIR is missing.");
}

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing.");
}

if (!process.env.RAPIDAPI_KEY) {
    throw new Error("RAPIDAPI_KEY is missing. Add it to your .env.local file.");
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("neon.tech")
        ? { rejectUnauthorized: false }
        : false,
    max: 1,
});

const db = drizzle(pool, { schema });

const parsePrice = (priceStr: string | null): string => {
    if (!priceStr) return faker.commerce.price({ min: 10, max: 200 });
    const cleaned = priceStr.replace(/[^0-9.]/g, "");
    return cleaned || faker.commerce.price({ min: 10, max: 200 });
};

// Bulletproof JSON saving using Atomic Writes
function saveItemToJson(item: any, itemsFilePath: string) {
    const tempFilePath = path.join(__dirname, "items.tmp.json");
    let existingItems = [];

    if (fs.existsSync(itemsFilePath)) {
        try {
            const fileContent = fs.readFileSync(itemsFilePath, "utf-8");
            existingItems = fileContent ? JSON.parse(fileContent) : [];
        } catch (error) {
            console.error(" ⚠️ JSON parse error detected. Creating backup...");
            fs.copyFileSync(
                itemsFilePath,
                `${itemsFilePath}.bak-${Date.now()}`,
            );
            existingItems = [];
        }
    }

    existingItems.push(item);
    fs.writeFileSync(tempFilePath, JSON.stringify(existingItems, null, 2));
    fs.renameSync(tempFilePath, itemsFilePath);

    return existingItems.length;
}

async function main() {
    console.log("🚀 Starting Stage 1: Raw Amazon Item Seed...");

    try {
        // 1. Ensure users exist to attach as sellers
        const usersFilePath = path.join(__dirname, "users.json");
        if (!fs.existsSync(usersFilePath)) {
            throw new Error(
                "❌ users.json not found. Run the user seed first.",
            );
        }
        const users = JSON.parse(fs.readFileSync(usersFilePath, "utf-8")).users;

        // 2. Establish "Resume" State
        const itemsFilePath = path.join(__dirname, "items.json");
        let currentItemCount = 0;
        const processedImageUrls = new Set(); // Using the image URL as a unique fingerprint

        if (fs.existsSync(itemsFilePath)) {
            const fileContent = fs.readFileSync(itemsFilePath, "utf-8");
            const existingItems = fileContent ? JSON.parse(fileContent) : [];
            currentItemCount = existingItems.length;
            existingItems.forEach((item: any) =>
                processedImageUrls.add(item.images[0]),
            );
        }

        console.log(
            `📊 Found ${currentItemCount} existing items. Target is ${TARGET_ITEMS}.`,
        );

        if (currentItemCount >= TARGET_ITEMS) {
            console.log("✅ Target already reached. Exiting.");
            process.exit(0);
        }

        const searchQueries = [
            "Phone",
            "Laptop",
            "Furniture",
            "Camera",
            "Headphones",
            "Vintage",
            "Kitchen",
            "Fitness",
            "Guitar",
            "Tools",
        ];
        let queryIndex = 0;
        let page = 1;

        // 3. Fetch and Save Loop
        while (currentItemCount < TARGET_ITEMS) {
            const query = searchQueries[queryIndex % searchQueries.length];
            const url = `https://real-time-amazon-data.p.rapidapi.com/search?query=${query}&page=${page}&country=US&sort_by=RELEVANCE&product_condition=ALL&is_prime=false&deals_and_discounts=NONE`;

            try {
                console.log(
                    ` 🔍 Fetching page ${page} for query "${query}"...`,
                );
                const res = await fetch(url, {
                    headers: {
                        "x-rapidapi-key": process.env.RAPIDAPI_KEY as string,
                        "x-rapidapi-host":
                            "real-time-amazon-data.p.rapidapi.com",
                    },
                });
                const json = await res.json();

                if (json.data?.products?.length > 0) {
                    for (const product of json.data.products) {
                        // Skip if we hit the target
                        if (currentItemCount >= TARGET_ITEMS) break;

                        // Skip if missing data OR if we already processed this exact image/item
                        if (
                            !product.product_title ||
                            !product.product_photo ||
                            processedImageUrls.has(product.product_photo)
                        ) {
                            continue;
                        }

                        // Mark as processed
                        processedImageUrls.add(product.product_photo);

                        const randomSeller = faker.helpers.arrayElement(users);
                        const price = parsePrice(
                            product.product_price ||
                                product.product_minimum_offer_price,
                        );

                        // Raw Amazon Title and Placeholder Description
                        const itemRecord = {
                            id: uuidv4(),
                            sellerId: randomSeller.id,
                            title: product.product_title,
                            description: "Description coming soon...", // Placeholder
                            price,
                            condition: faker.helpers.arrayElement([
                                "new",
                                "like-new",
                                "good",
                                "fair",
                                "poor",
                            ]),
                            status: "available",
                            images: [product.product_photo],
                            // embedding field is intentionally omitted, will default to null in DB
                        };

                        // Insert into DB
                        await db.insert(schema.items).values({
                            ...itemRecord,
                            condition: itemRecord.condition as any,
                            status: itemRecord.status as any,
                        });

                        // Save to JSON and update count
                        currentItemCount = saveItemToJson(
                            itemRecord,
                            itemsFilePath,
                        );

                        console.log(
                            ` ✨ [${currentItemCount}/${TARGET_ITEMS}] Saved: ${itemRecord.title.substring(0, 40)}...`,
                        );
                    }
                } else {
                    // API returned empty for this query/page, move on
                    queryIndex++;
                    page = 1;
                    continue;
                }

                // Pagination logic
                if (page >= 3) {
                    queryIndex++;
                    page = 1;
                } else {
                    page++;
                }

                // Very small delay to respect RapidAPI rate limits
                await new Promise((resolve) => setTimeout(resolve, 500));
            } catch (error) {
                console.error(` ❌ API fetch error. Script pausing...`, error);
                // Break out of the while loop safely
                break;
            }
        }

        console.log(
            `✅ Stage 1 finished. Total items in DB/JSON: ${currentItemCount}`,
        );
    } catch (error) {
        console.error("❌ Seed failed:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
