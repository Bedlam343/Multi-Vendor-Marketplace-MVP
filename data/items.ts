// data layer for fetching items with filters
// doesn't care how it's called, just provides the data

import { desc, eq, and, gte, lte, count, sql } from "drizzle-orm";
import { db } from "@/db";
import { items, user } from "@/db/schema";
import { itemFilterSchema, type ItemFilters } from "@/db/validation";
import { generateEmbedding } from "@/lib/openai";
import {
    SIMILARITY_THRESHOLD,
    ITEM_LIMIT_DEFAULT,
    ITEM_LIMIT_MAX,
} from "@/utils/constants";

export const getItems = async (filters: ItemFilters) => {
    const validation = itemFilterSchema.safeParse(filters);

    const {
        page = 1,
        limit = ITEM_LIMIT_DEFAULT,
        search,
        condition,
        minPrice,
        maxPrice,
        sellerId,
    } = validation.success
        ? validation.data
        : { page: 1, limit: ITEM_LIMIT_DEFAULT };

    const numItems = Math.min(limit, ITEM_LIMIT_MAX);
    const offset = (page - 1) * numItems;

    // Build dynamic conditions
    const whereConditions = [eq(items.status, "available")];
    if (sellerId) whereConditions.push(eq(items.sellerId, sellerId));
    if (condition) whereConditions.push(eq(items.condition, condition));
    if (minPrice) whereConditions.push(gte(items.price, minPrice.toString()));
    if (maxPrice) whereConditions.push(lte(items.price, maxPrice.toString()));

    let orderBy = desc(items.createdAt);

    if (search) {
        const searchEmbedding = await generateEmbedding(search);
        const vectorStr = JSON.stringify(searchEmbedding);

        const similarity = sql`1 - (${items.embedding} <=> ${vectorStr}::vector)`;

        // Only include items with similarity above a threshold
        whereConditions.push(sql`${similarity} > ${SIMILARITY_THRESHOLD}`);

        orderBy = desc(similarity);
    }

    const [totalResult, rows] = await Promise.all([
        db
            .select({ count: count() })
            .from(items)
            .where(and(...whereConditions)),
        db
            .select({
                id: items.id,
                title: items.title,
                description: items.description,
                price: items.price,
                images: items.images,
                condition: items.condition,
                createdAt: items.createdAt,
                status: items.status,
                seller: {
                    name: user.name,
                    image: user.image,
                },
            })
            .from(items)
            .leftJoin(user, eq(items.sellerId, user.id)) // join to get seller info
            .where(and(...whereConditions))
            .limit(numItems)
            .offset(offset)
            .orderBy(orderBy),
    ]);

    return {
        data: rows,
        pagination: {
            total: totalResult[0].count,
            pages: Math.ceil(totalResult[0].count / numItems),
            currentPage: page,
        },
    };
};

export const getItemById = async (id: string) => {
    const result = await db
        .select({
            id: items.id,
            title: items.title,
            description: items.description,
            price: items.price,
            images: items.images,
            condition: items.condition,
            createdAt: items.createdAt,
            status: items.status,
            seller: {
                name: user.name,
                image: user.image,
            },
        })
        .from(items)
        .leftJoin(user, eq(items.sellerId, user.id))
        .where(eq(items.id, id))
        .limit(1);

    return result[0] || null;
};

export type GetItemResult = Awaited<ReturnType<typeof getItems>>;
export type ItemWithSeller = GetItemResult["data"][number];
