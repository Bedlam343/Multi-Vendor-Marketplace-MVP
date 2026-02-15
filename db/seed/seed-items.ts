import { loadEnvConfig } from "@next/env";
const projectDir = process.cwd();
loadEnvConfig(projectDir);

import { Storage } from "@google-cloud/storage";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import { faker } from "@faker-js/faker";
import sharp from "sharp";

import * as schema from "../schema";
import { GCS_DOMAIN } from "@/utils/constants";

// GLOBAL CONSTANT FOR GENERATION
const ITEMS_TO_GENERATE = 1;

export const storage = new Storage({ keyFilename: "gs-service-account.json" });

export const BUCKET_NAME = process.env.GCP_BUCKET_NAME!;
export const LISTING_IMAGES_DIR = process.env.GCP_LISTING_IMAGES_DIR!;

if (!BUCKET_NAME || !LISTING_IMAGES_DIR) {
    throw new Error("GCP_BUCKET_NAME or GCP_LISTING_IMAGES_DIR is missing.");
}
if (!process.env.DATABASE_URL || !process.env.OPENAI_API_KEY) {
    throw new Error("DATABASE_URL or OPENAI_API_KEY is missing.");
}
if (!process.env.POLLINATIONS_SECRET_KEY) {
    console.warn(
        "POLLINATIONS_SECRET_KEY is missing. High quality generation might fail.",
    );
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

// Replace the old categories with these hyper-specific niches
const ITEM_NICHES = [
    "espresso machine accessories",
    "analog synthesizers",
    "ultralight backpacking gear",
    "cordless woodworking tools",
    "mechanical keyboard switches",
    "saltwater aquarium equipment",
    "gravel bike components",
    "vintage 35mm film lenses",
    "tabletop RPG terrain",
    "sneaker restoration supplies",
    "home kombucha brewing kits",
    "smart home security sensors",
    "left-handed golf clubs",
    "shortboard surfboards",
    "DJ midi controllers",
    "ceramic pottery wheels",
    "hot yoga accessories",
    "turntable cartridges",
    "FPV drone parts",
    "cast iron camping cookware",
    "backcountry ski bindings",
    "resin 3D printer supplies",
    "auto detailing polishers",
    "longboard skateboard trucks",
    "telescope eyepieces",
    "hydroponic gardening lights",
    "ham-radio antennas",
    "boutique guitar pedals",
    "high-end chef knives",
    "powerlifting belts",
];

const generateItemMetadata = async () => {
    const niche = faker.helpers.arrayElement(ITEM_NICHES);

    const randomAdjective = faker.word.adjective();
    const randomMaterial = faker.commerce.productMaterial();

    const prompt = `You are generating a realistic listing for a peer-to-peer marketplace like Craigslist or Facebook Marketplace.
    
    CORE REQUIREMENT:
    - Item Niche: ${niche}
    - Creative constraints: Incorporate the concepts of "${randomAdjective}" and "${randomMaterial}" into the item's design, style, or description to make it unique.

    STRICT RULES:
    1. DO NOT generate the most famous brand or item in this niche. Pick obscure, enthusiast, or mid-tier brands.
    2. DO NOT include food, digital goods, or services.
    3. Make the title highly specific (include realistic model numbers or specific colors).
    4. Write the description exactly like a normal human trying to clear out their garage or closet. Include a realistic reason for selling.
    5. AVOID sounding like a professional marketer or Amazon listing.
    6. Generate a matching, realistic home or outdoor background environment for the item to be photographed in (e.g., a skillet goes "on a kitchen counter", a surfboard goes "leaning against a garage wall", a keyboard goes "on a wooden desk").`;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 1.1,
        messages: [{ role: "user", content: prompt }],
        response_format: {
            type: "json_schema",
            json_schema: {
                name: "marketplace_item",
                strict: true,
                schema: {
                    type: "object",
                    properties: {
                        title: {
                            type: "string",
                            description: "A realistic, specific product title.",
                        },
                        description: {
                            type: "string",
                            description:
                                "A 2-3 sentence description written by a casual seller.",
                        },
                        price: {
                            type: "number",
                            description:
                                "A realistic price for a used/secondhand item in dollars.",
                        },
                        condition: {
                            type: "string",
                            enum: ["new", "like-new", "good", "fair", "poor"],
                        },
                        environment: {
                            type: "string",
                            description:
                                "A brief, realistic physical setting to photograph this specific item in (e.g., 'on a cluttered workbench', 'on a living room rug', 'placed on a kitchen island').",
                        },
                    },
                    required: [
                        "title",
                        "description",
                        "price",
                        "condition",
                        "environment",
                    ],
                    additionalProperties: false,
                },
            },
        },
    });

    return JSON.parse(response.choices[0].message.content!);
};

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

        // console.log("🗑️  Emptying existing items...");
        // await db.execute(sql`TRUNCATE TABLE "items" RESTART IDENTITY CASCADE;`);

        try {
            await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector;`);
        } catch (e) {
            // Ignore if already enabled
        }

        const generatedItems = [];
        console.log(`📦 Generating ${ITEMS_TO_GENERATE} random listings...`);

        for (let i = 0; i < ITEMS_TO_GENERATE; i++) {
            const randomSeller = faker.helpers.arrayElement(users);

            const metadata = await generateItemMetadata();

            const title = metadata.title;
            const description = metadata.description;
            const price = metadata.price;
            const condition = metadata.condition;
            const itemEnvironment = metadata.environment;
            const status = "available";

            // 1. Generate Image URL
            console.log(
                ` 🎨 [${i + 1}/${ITEMS_TO_GENERATE}] Requesting image from Pollinations...`,
            );
            const cleanTitle = title.replace(/[^a-zA-Z0-9 ]/g, "");

            const aiPrompt = encodeURIComponent(
                `professional high-resolution product photography of a ${cleanTitle}, ${itemEnvironment}, 8k resolution, highly detailed`,
            );

            const pollinationsUrl = `https://gen.pollinations.ai/image/${aiPrompt}?model=flux&seed=-1`;

            let finalGcpUrl = "";

            try {
                // 2. Fetch the image buffer
                const imageResponse = await fetch(pollinationsUrl, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${process.env.POLLINATIONS_SECRET_KEY}`,
                        // Accept: "image/webp, image/png, image/* ",
                    },
                });

                if (!imageResponse.ok) {
                    const errorText = await imageResponse.text();
                    throw new Error(
                        `Pollinations API Error (${imageResponse.status}): ${errorText}`,
                    );
                }
                const arrayBuffer = await imageResponse.arrayBuffer();
                const imageBuffer = Buffer.from(arrayBuffer);

                // 3. Optimize with Sharp (Resize to 768x768, convert to WebP, 80% quality)
                console.log(` ⚙️  Optimizing image with Sharp...`);
                const optimizedBuffer = await sharp(imageBuffer)
                    .resize(768, 768, { fit: "inside" })
                    .webp({ quality: 80 })
                    .toBuffer();

                // 4. Upload directly to GCP Bucket
                console.log(` ☁️  Uploading optimized WebP to GCP...`);
                const safeUsername = randomSeller.name
                    .replace(/[^a-zA-Z0-9]/g, "_")
                    .toLowerCase();
                const filename = `${LISTING_IMAGES_DIR}/${safeUsername}_${randomSeller.id}/${uuidv4()}.webp`;

                const file = storage.bucket(BUCKET_NAME).file(filename);
                await file.save(optimizedBuffer, {
                    contentType: "image/webp",
                    resumable: false, // Faster for small files
                });

                finalGcpUrl = `https://${GCS_DOMAIN}/${BUCKET_NAME}/${filename}`;
                console.log(` ✅ Uploaded! Final URL: ${finalGcpUrl}`);
            } catch (error) {
                console.error(
                    ` ❌ Image generation/upload failed for "${title}". Using fallback.`,
                    error,
                );

                finalGcpUrl =
                    "https://placehold.co/768x768.webp?text=Image+Unavailable";
            }

            // 5. Generate Vector Embedding
            console.log(` ✨ Generating OpenAI embedding for: "${title}"`);
            let embedding = new Array(1536).fill(0);
            try {
                embedding = await generateEmbedding(`${title} ${description}`);
            } catch (error) {
                console.error(
                    ` ❌ OpenAI API Error. Using zero-vector fallback.`,
                );
            }

            const itemRecord = {
                sellerId: randomSeller.id,
                title,
                description,
                price: String(price),
                condition,
                status,
                images: [finalGcpUrl], // Storing the permanent GCP URL
                embedding,
            };

            // 6. Insert into Database
            await db.insert(schema.items).values({
                ...itemRecord,
                condition: itemRecord.condition as any,
                status: itemRecord.status as any,
            });

            generatedItems.push({ ...itemRecord, id: faker.string.uuid() });
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

function overwriteItemsFile(generatedItems: any[]) {
    const itemsFilePath = path.join(__dirname, "items.json");
    fs.writeFileSync(itemsFilePath, JSON.stringify(generatedItems, null, 2));

    console.log(`💾 Saved ${generatedItems.length} items to ${itemsFilePath}`);
}

function appendItemsToFile(generatedItems: any[]) {
    const itemsFilePath = path.join(__dirname, "items.json");
    let existingItems = [];

    // Check if the file already exists to read it
    if (fs.existsSync(itemsFilePath)) {
        try {
            const fileContent = fs.readFileSync(itemsFilePath, "utf-8");
            // Ensure we handle empty files or malformed JSON
            existingItems = fileContent ? JSON.parse(fileContent) : [];
        } catch (error) {
            console.error(
                "⚠️  Existing items.json was malformed. Starting fresh.",
            );
            existingItems = [];
        }
    }

    // Combine the old items with the new ones
    const updatedItems = [...existingItems, ...generatedItems];

    fs.writeFileSync(itemsFilePath, JSON.stringify(updatedItems, null, 2));

    console.log(
        `💾 Successfully appended ${generatedItems.length} items. Total count: ${updatedItems.length}`,
    );
}

main();
