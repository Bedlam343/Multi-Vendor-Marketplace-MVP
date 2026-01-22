"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { eq } from "drizzle-orm";

import { generateEmbedding } from "@/lib/openai";
import { authenticatedAction } from "@/lib/safe-action";
import { db } from "@/db";
import { items } from "@/db/schema";
import { insertItemSchema, CreateItemFieldErrors } from "@/db/validation";

export type CreateItemActionResponse = {
    success?: boolean;
    message?: string;
    errors?: CreateItemFieldErrors;
    newItemId?: string;
};

export const createItemAction = async (
    prevState: CreateItemActionResponse | undefined,
    formData: FormData,
): Promise<CreateItemActionResponse> => {
    return authenticatedAction(formData, async (data, session) => {
        // The frontend loop must append them like: formData.append('images', url1); formData.append('images', url2);
        const imageUrls = data.getAll("images") as string[];

        const rawData = {
            title: data.get("title"),
            description: data.get("description"),
            price: data.get("price"),
            condition: data.get("condition"),
            images: imageUrls.length > 0 ? imageUrls : [], // Pass empty array if none
        } as const;

        const validationFields = insertItemSchema.safeParse(rawData);
        if (!validationFields.success) {
            return {
                success: false,
                errors: z.flattenError(validationFields.error).fieldErrors,
            };
        }

        let newItemId: string;

        try {
            const [insertedItem] = await db
                .insert(items)
                .values({
                    ...validationFields.data,
                    sellerId: session.user.id,
                    embedding: null, // Temporarily set to null
                })
                .returning({ id: items.id }); // Get the inserted item's ID

            newItemId = insertedItem.id;
        } catch (error) {
            return {
                success: false,
                message: "An error occurred while creating the item.",
            };
        }

        // background task to generate and update embedding
        after(async () => {
            try {
                const textToEmbed = `${validationFields.data.title} ${validationFields.data.description}`;
                const embedding = await generateEmbedding(textToEmbed);

                // Update the specific item with the vector
                await db
                    .update(items)
                    .set({ embedding })
                    .where(eq(items.id, newItemId));

                console.log(
                    `Background: Embedding generated for item ${newItemId}`,
                );
            } catch (error) {
                console.error(
                    "Background error generating embedding for item:",
                    error,
                );
            }
        });

        revalidatePath("/dashboard");

        return {
            success: true,
            message: "Item created successfully.",
            newItemId,
        };
    });
};
