import { pgEnum } from "drizzle-orm/pg-core";

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
