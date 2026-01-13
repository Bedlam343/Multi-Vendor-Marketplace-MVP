import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, user } from "@/db/schema";
import { getItems } from "@/data/items";
import { getOrders } from "@/data/orders";

export async function getDashboardData(userId: string) {
    // We use Promise.all to fire off all database requests simultaneously
    const [userResult, activeListings, recentSales, recentPurchases, stats] =
        await Promise.all([
            // A. User Profile (for the header)
            db
                .select({
                    name: user.name,
                    image: user.image,
                    email: user.email,
                    joinedAt: user.createdAt,
                })
                .from(user)
                .where(eq(user.id, userId))
                .then((res) => res[0]),

            // B. Active Listings (Reuse existing logic!)
            // We only want the top 5 to show "Recent Listings"
            getItems({ sellerId: userId, limit: 5, page: 1 }),

            // C. Recent Sales (Reuse existing logic!)
            getOrders(userId, "seller", 1, 5),

            // D. Recent Purchases (Reuse existing logic!)
            getOrders(userId, "buyer", 1, 5),

            // E. Lifetime Analytics (The "Fast" Aggregation)
            // We do a raw aggregation here because paging through getOrders is too slow for "Total Revenue"
            db
                .select({
                    totalRevenue: sql<string>`coalesce(sum(${orders.amountPaid}), 0)`,
                    totalSalesCount: sql<number>`count(*)`,
                })
                .from(orders)
                .where(eq(orders.sellerId, userId))
                .then((res) => res[0]),
            ,
        ]);

    return {
        user: userResult,
        selling: {
            stats: {
                revenue: Number(stats?.totalRevenue || 0),
                ordersCount: Number(stats?.totalSalesCount || 0),
                activeListingCount: activeListings.pagination.total,
            },
            recentListings: activeListings.data,
            recentSales: recentSales.data,
        },
        buying: {
            recentOrders: recentPurchases.data,
            totalOrdersCount: recentPurchases.pagination.total,
        },
    };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
