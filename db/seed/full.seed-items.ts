import { loadEnvConfig } from "@next/env";
const projectDir = process.cwd();
loadEnvConfig(projectDir);

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import { faker } from "@faker-js/faker";

import * as schema from "../schema";

const ITEMS_TO_GENERATE = 500;

if (!process.env.DATABASE_URL || !process.env.OPENAI_API_KEY) {
    throw new Error("DATABASE_URL or OPENAI_API_KEY is missing.");
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
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const generateEmbedding = async (text: string) => {
    const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text.replace(/\n/g, " "),
    });
    return response.data[0].embedding;
};

// Generates a casual, marketplace-style description based on the Amazon title
// Extracts a clean title and generates a casual description in one API call
const generateListingDetails = async (rawAmazonTitle: string) => {
    const prompt = `You are helping to create realistic listings for a local peer-to-peer marketplace. 
    Here is a raw, SEO-stuffed Amazon product title: "${rawAmazonTitle}"
    
    Tasks:
    1. Extract a short, natural-sounding title a normal human would use (maximum 5-6 words). Example: "Apple iPhone 13 Pro Max" or "Vintage Cast Iron Skillet".
    2. Write a 2-sentence casual description as if you are clearing out your closet or garage. Do not sound like a marketer.
    
    Respond STRICTLY in JSON format with the keys "title" and "description".`;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || "{}";

    try {
        const parsed = JSON.parse(content);
        return {
            title: parsed.title || rawAmazonTitle.substring(0, 40) + "...",
            description:
                parsed.description ||
                "Selling this item locally. Let me know if you are interested!",
        };
    } catch (e) {
        return {
            title: rawAmazonTitle.substring(0, 40) + "...",
            description:
                "Selling this item locally. Let me know if you are interested!",
        };
    }
};
// Clean the Amazon price string (e.g., "$45.00" -> "45.00")
const parsePrice = (priceStr: string | null): string => {
    if (!priceStr) return faker.commerce.price({ min: 10, max: 200 }); // Fallback
    const cleaned = priceStr.replace(/[^0-9.]/g, "");
    return cleaned || faker.commerce.price({ min: 10, max: 200 });
};

async function fetchAmazonProducts(targetCount: number) {
    console.log(
        `🌐 Fetching ${targetCount} products from RapidAPI Amazon Data...`,
    );

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
    const uniqueProductsMap = new Map();

    let queryIndex = 0;
    let page = 1;

    while (uniqueProductsMap.size < targetCount) {
        const query = searchQueries[queryIndex % searchQueries.length];
        const url = `https://real-time-amazon-data.p.rapidapi.com/search?query=${query}&page=${page}&country=US&sort_by=RELEVANCE&product_condition=ALL&is_prime=false&deals_and_discounts=NONE`;

        const options = {
            method: "GET",
            headers: {
                "x-rapidapi-key": process.env.RAPIDAPI_KEY as string,
                "x-rapidapi-host": "real-time-amazon-data.p.rapidapi.com",
            },
        };

        try {
            console.log(` 🔍 Fetching page ${page} for query "${query}"...`);
            const res = await fetch(url, options);
            const json = await res.json();

            if (
                json.data &&
                json.data.products &&
                json.data.products.length > 0
            ) {
                for (const item of json.data.products) {
                    if (
                        item.product_title &&
                        item.product_photo &&
                        !uniqueProductsMap.has(item.asin)
                    ) {
                        uniqueProductsMap.set(item.asin, item);
                    }
                    if (uniqueProductsMap.size >= targetCount) break;
                }
            } else {
                // If this page/query returns no results, move to the next query
                console.warn(
                    ` ⚠️ No more results for "${query}". Switching categories.`,
                );
                queryIndex++;
                page = 1;
                continue;
            }

            // Move to the next page for the same query, or rotate query to keep data diverse
            if (page >= 3) {
                queryIndex++;
                page = 1;
            } else {
                page++;
            }
        } catch (error) {
            console.error(` ❌ Failed to fetch from RapidAPI:`, error);
            break; // Break to avoid infinite failure loops
        }
    }

    const finalProducts = Array.from(uniqueProductsMap.values()).slice(
        0,
        targetCount,
    );
    console.log(
        `✅ Successfully fetched ${finalProducts.length} unique items.`,
    );
    return finalProducts;
}

async function main() {
    console.log("🚀 Starting database seed for Items...");

    try {
        const dataFilePath = path.join(__dirname, "users.json");
        if (!fs.existsSync(dataFilePath)) {
            console.error(`❌ users.json not found. Run the user seed first.`);
            process.exit(1);
        }

        const rawData = fs.readFileSync(dataFilePath, "utf-8");
        const users = JSON.parse(rawData).users;

        if (!users || users.length === 0) {
            console.error("❌ No users found in users.json.");
            process.exit(1);
        }

        try {
            await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector;`);
        } catch (e) {
            // Ignore if already enabled
        }

        const amazonProducts = await fetchAmazonProducts(ITEMS_TO_GENERATE);
        const generatedItems = [];

        console.log(
            `📦 Processing ${amazonProducts.length} items (Generating descriptions & embeddings)...`,
        );
        console.log(
            `⏳ Note: This will take a few minutes due to OpenAI rate limits...`,
        );

        for (let i = 0; i < amazonProducts.length; i++) {
            const product = amazonProducts[i];
            const randomSeller = faker.helpers.arrayElement(users);

            const title = product.product_title;
            const price = parsePrice(
                product.product_price || product.product_minimum_offer_price,
            );
            const image = product.product_photo;
            const condition = faker.helpers.arrayElement([
                "new",
                "like-new",
                "good",
                "fair",
                "poor",
            ]);
            const status = "available";

            console.log(
                ` ✨ [${i + 1}/${amazonProducts.length}] Processing: ${product.product_title.substring(0, 40)}...`,
            );

            // 1. Generate clean title and realistic description via OpenAI
            let cleanTitle = "";
            let description = "";
            try {
                const details = await generateListingDetails(
                    product.product_title,
                );
                cleanTitle = details.title;
                description = details.description;
            } catch (err) {
                console.warn(` ⚠️ OpenAI extraction failed. Using fallbacks.`);
                cleanTitle = product.product_title.substring(0, 40) + "...";
                description =
                    "Selling this item locally. Works great, let me know if you are interested!";
            }

            // 2. Generate Vector Embedding (using the newly cleaned title)
            let embedding = new Array(1536).fill(0);
            try {
                embedding = await generateEmbedding(
                    `${cleanTitle} ${description}`,
                );
            } catch (error) {
                console.error(
                    ` ❌ OpenAI Embedding Error. Using zero-vector fallback.`,
                );
            }

            const itemRecord = {
                id: uuidv4(),
                sellerId: randomSeller.id,
                title: cleanTitle, // <-- Using the new clean title here
                description,
                price,
                condition,
                status,
                images: [image],
                embedding,
            };

            // Insert into Database
            await db.insert(schema.items).values({
                ...itemRecord,
                condition: itemRecord.condition as any,
                status: itemRecord.status as any,
            });

            generatedItems.push(itemRecord);
        }

        appendItemsToFile(generatedItems);

        console.log("✅ Items seed completed successfully!");
    } catch (error) {
        console.error("❌ Seed failed:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

function appendItemsToFile(generatedItems: any[]) {
    const itemsFilePath = path.join(__dirname, "items.json");
    let existingItems = [];

    if (fs.existsSync(itemsFilePath)) {
        try {
            const fileContent = fs.readFileSync(itemsFilePath, "utf-8");
            existingItems = fileContent ? JSON.parse(fileContent) : [];
        } catch (error) {
            console.error(
                "⚠️  Existing items.json was malformed. Starting fresh.",
            );
            existingItems = [];
        }
    }

    const updatedItems = [...existingItems, ...generatedItems];
    fs.writeFileSync(itemsFilePath, JSON.stringify(updatedItems, null, 2));

    console.log(
        `💾 Successfully appended ${generatedItems.length} items. Total count: ${updatedItems.length}`,
    );
}

main();
