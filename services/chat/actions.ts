"use server";

import { eq, and, or } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { pusher } from "@/lib/pusher";
import { authenticatedAction } from "@/lib/safe-action";
import { conversations, messages } from "@/db/schema";
import { getItemById } from "@/data/items";
import { type SendFirstMessageInput } from "@/db/validation";

export async function createConversation(data: SendFirstMessageInput) {}
