import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { user, items, messages, account } from "./schema";
import { z } from "zod";

export const selectUserSchema = createSelectSchema(user);
export const insertUserSchema = createInsertSchema(user, {
    email: z.email("Invalid email address"),
    name: z.string().min(2, "Name must be at least 2 characters long"),
});

export const selectItemSchema = createSelectSchema(items);
export const insertItemSchema = createInsertSchema(items, {
    title: z.string().min(5, "Title must be at least 5 characters long"),
    price: (s) =>
        s.refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
            message: "Price must be a positive number",
        }),
}).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export const selectMessageSchema = createSelectSchema(messages);
export const insertMessageSchema = createInsertSchema(messages, {
    content: z.string().min(1, "Message content cannot be empty"),
}).omit({
    id: true,
});

export const loginSchema = z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
});
