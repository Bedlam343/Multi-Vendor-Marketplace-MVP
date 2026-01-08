import {
    pgTable,
    text,
    timestamp,
    boolean,
    uuid,
    decimal,
    vector,
    pgEnum,
} from "drizzle-orm/pg-core";

// User Table and Session Table for Better Auth Integration
export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("emailVerified").notNull(),
    image: text("image"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expiresAt").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
});

// Better Auth uses this table for holding the credentials
export const account = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

/* --- ENUMS --- */
export const itemConditionEnum = pgEnum("item_condition", [
    "new",
    "like-new",
    "good",
    "fair",
    "poor",
]);

export const itemStatusEnum = pgEnum("item_status", [
    "available",
    "sold",
    "reserved",
]);
/* --- */

// Marketplace Data Tables
export const items = pgTable("items", {
    id: uuid("id").primaryKey().defaultRandom(),
    sellerId: text("sellerId")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    condition: itemConditionEnum("condition").notNull(),
    status: itemStatusEnum("status").notNull().default("available"),
    images: text("images").array().notNull(),
    embedding: vector("embedding", { dimensions: 1536 }), // Optimized for OpenAI
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
    id: uuid("id").primaryKey().defaultRandom(),
    senderId: text("senderId")
        .notNull()
        .references(() => user.id),
    receiverId: text("receiverId")
        .notNull()
        .references(() => user.id),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
});
