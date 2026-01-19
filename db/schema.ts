import {
    pgTable,
    text,
    timestamp,
    boolean,
    uuid,
    decimal,
    vector,
    pgEnum,
    integer,
} from "drizzle-orm/pg-core";

// User Table and Session Table for Better Auth Integration
export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("emailVerified").notNull(),
    image: text("image"),

    cryptoWalletAddress: text("cryptoWalletAddress"),
    stripeCustomerId: text("stripeCustomerId"),
    savedCardBrand: text("savedCardBrand"),
    savedCardLast4: text("savedCardLast4"),

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

export const orderStatusEnum = pgEnum("order_status", [
    "pending",
    "completed",
    "cancelled",
    "refunded",
]);
export const paymentMethodEnum = pgEnum("paymentMethod", ["card", "crypto"]);
export const cardBrandEnum = pgEnum("cardBrand", [
    "visa",
    "mastercard",
    "amex",
    "discover",
    "other",
]);
export const orders = pgTable("orders", {
    id: uuid("id").primaryKey().defaultRandom(),
    itemId: uuid("itemId")
        .notNull()
        .references(() => items.id),
    buyerId: text("buyerId")
        .notNull()
        .references(() => user.id),
    sellerId: text("sellerId") // Redundant but makes Seller Dashboard queries much faster
        .notNull()
        .references(() => user.id),

    // pricing snapshots
    amountPaidUsd: decimal("amountPaidUsd", {
        precision: 10,
        scale: 2,
    }).notNull(),
    amountPaidCrypto: text("amountPaidCrypto"), // stored as text to handle high precision

    // payment tracking
    paymentMethod: paymentMethodEnum("paymentMethod").notNull().default("card"),

    // crypto payment tracking
    txHash: text("txHash").unique(), // unique identifier on the blockchain
    chainId: integer("chainId"), // e.g. 11155111 for Sepolia
    buyerWalletAddress: text("buyerWalletAddress"), // the address the buyer used
    sellerWalletAddress: text("sellerWalletAddress"), // the address the seller used'

    // card payment tracking
    stripePaymentIntentId: text("stripePaymentIntentId").unique(),
    cardBrand: cardBrandEnum("cardBrand"),
    cardLast4: text("cardLast4"),

    status: orderStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt")
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});
