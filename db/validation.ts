import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { user, items, messages, itemConditionEnum } from "@/db/schema";
import {
    GCS_DOMAIN,
    ITEM_LIMIT_DEFAULT,
    ITEM_LIMIT_MAX,
} from "@/utils/constants";

export const selectUserSchema = createSelectSchema(user);

const baseUserSchema = createInsertSchema(user).omit({
    id: true,
    emailVerified: true,
    createdAt: true,
    updatedAt: true,
    image: true,
});
export const insertUserSchema = baseUserSchema
    .extend({
        email: z.email("Invalid email address").toLowerCase().trim(),
        name: z.string().min(2, "Name must be at least 2 characters long"),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters long")
            .regex(/[A-Z]/, "Include at least one uppercase letter")
            .regex(/[0-9]/, "Include at least one number"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export const loginSchema = z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(1, "Password is required."),
});

export type LoginFieldErrors = z.ZodFlattenedError<
    z.infer<typeof loginSchema>
>["fieldErrors"];
export type SignupFieldErrors = z.ZodFlattenedError<
    z.infer<typeof insertUserSchema>
>["fieldErrors"];

// --- Item Schemas ---
export const selectItemSchema = createSelectSchema(items);
export const insertItemSchema = createInsertSchema(items, {
    title: z.string().min(5, "Title must be at least 5 characters long"),
    description: z
        .string()
        .min(10, "Description must be at least 10 characters long"),
    price: (s) =>
        s.refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
            message: "Price must be a positive number",
        }),
    condition: z.enum(itemConditionEnum.enumValues, {
        message: "Please select a valid item condition",
    }),
    images: z
        .array(
            z
                .url("Invalid image URL")
                .startsWith(
                    `${GCS_DOMAIN}`,
                    "Image must be uploaded to our storage"
                )
        )
        .min(1, "At least one image is required")
        .max(5, "You can upload a maximum of 5 images"),
}).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    sellerId: true,
    embedding: true,
    status: true, // Status will default to 'available'
});

export type CreateItemFieldErrors = z.ZodFlattenedError<
    z.infer<typeof insertItemSchema>
>["fieldErrors"];

export const itemFilterSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce
        .number()
        .min(1)
        .max(ITEM_LIMIT_MAX)
        .default(ITEM_LIMIT_DEFAULT),
    search: z.string().optional(),
    condition: z.enum(itemConditionEnum.enumValues).optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    sellerId: z.string().optional(),
});

export type ItemFilters = z.infer<typeof itemFilterSchema>;

// --- Message Schemas --- //

export const selectMessageSchema = createSelectSchema(messages);
export const insertMessageSchema = createInsertSchema(messages, {
    content: z.string().min(1, "Message content cannot be empty"),
}).omit({
    id: true,
});
