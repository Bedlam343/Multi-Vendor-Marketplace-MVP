"use client";

import { DashboardData } from "@/data/dashboard";
import Link from "next/link";

interface Props {
    data: DashboardData;
}

export default function DashboardOverview({ data }: Props) {
    const { user, selling, buying } = data;

    return (
        <div className="max-w-6xl mx-auto p-8 font-sans">
            {/* --- Header Section --- */}
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                    {user?.image ? (
                        <img
                            src={user.image}
                            alt={user.name || "User"}
                            className="w-16 h-16 rounded-full border-2 border-gray-200"
                        />
                    ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-xl font-bold text-gray-500">
                            {user?.name?.[0]?.toUpperCase() || "U"}
                        </div>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Welcome back, {user?.name}
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Member since{" "}
                            {user?.joinedAt
                                ? new Date(user.joinedAt).toLocaleDateString()
                                : "2026"}
                        </p>
                    </div>
                </div>
                <Link
                    href="/create-item"
                    className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition shadow-md"
                >
                    + List New Item
                </Link>
            </div>

            {/* --- SELLING STATS ROW --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <StatCard
                    label="Total Revenue"
                    value={`$${selling.stats.revenue.toLocaleString()}`}
                    sublabel="Lifetime earnings"
                />
                <StatCard
                    label="Items Sold"
                    value={selling.stats.ordersCount}
                    sublabel="Completed orders"
                />
                <StatCard
                    label="Active Listings"
                    value={selling.stats.activeListingCount}
                    sublabel="Currently for sale"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* --- LEFT COL: SELLER VIEW --- */}
                <div>
                    <h2 className="text-xl font-bold mb-4 border-b pb-2">
                        Recent Sales
                    </h2>
                    {selling.recentSales.length === 0 ? (
                        <EmptyState message="No sales yet. Your listed items will appear here once sold." />
                    ) : (
                        <div className="flex flex-col gap-4">
                            {selling.recentSales.map((order) => (
                                <div
                                    key={order.id}
                                    className="flex gap-4 p-4 border rounded-lg bg-gray-50 items-center"
                                >
                                    <div className="w-12 h-12 bg-white rounded border overflow-hidden shrink-0">
                                        {order.item?.image?.[0] && (
                                            <img
                                                src={order.item.image[0]}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">
                                            {order.item?.title ||
                                                "Unknown Item"}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Sold to{" "}
                                            {order.counterparty?.name ||
                                                "Someone"}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-600">
                                            +${order.amountPaid}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(
                                                order.createdAt
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <h2 className="text-xl font-bold mb-4 mt-10 border-b pb-2">
                        Active Listings
                    </h2>
                    {selling.recentListings.length === 0 ? (
                        <EmptyState message="You have no active listings." />
                    ) : (
                        <div className="flex flex-col gap-3">
                            {selling.recentListings.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex justify-between items-center p-3 hover:bg-gray-50 rounded transition"
                                >
                                    <span className="font-medium truncate max-w-[200px]">
                                        {item.title}
                                    </span>
                                    <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                        ${item.price}
                                    </span>
                                </div>
                            ))}
                            <Link
                                href="/my-listings"
                                className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                            >
                                View all listings &rarr;
                            </Link>
                        </div>
                    )}
                </div>

                {/* --- RIGHT COL: BUYER VIEW --- */}
                <div>
                    <h2 className="text-xl font-bold mb-4 border-b pb-2">
                        My Purchases
                    </h2>
                    {buying.recentOrders.length === 0 ? (
                        <EmptyState message="You haven't bought anything yet." />
                    ) : (
                        <div className="flex flex-col gap-4">
                            {buying.recentOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className="flex gap-4 p-4 border rounded-lg items-center"
                                >
                                    <div className="w-12 h-12 bg-gray-100 rounded border overflow-hidden shrink-0">
                                        {order.item?.image?.[0] && (
                                            <img
                                                src={order.item.image[0]}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">
                                            {order.item?.title}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Seller: {order.counterparty?.name}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="inline-block px-2 py-1 text-xs font-bold text-white bg-black rounded-full mb-1">
                                            {order.status}
                                        </span>
                                        <p className="text-xs text-gray-500">
                                            -${order.amountPaid}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Small Helper Components ---

function StatCard({
    label,
    value,
    sublabel,
}: {
    label: string;
    value: string | number;
    sublabel: string;
}) {
    return (
        <div className="p-6 border rounded-xl shadow-sm bg-white">
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide">
                {label}
            </h3>
            <p className="text-3xl font-extrabold text-gray-900 mt-2">
                {value}
            </p>
            <p className="text-xs text-gray-400 mt-1">{sublabel}</p>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
            <p className="text-gray-500 text-sm">{message}</p>
        </div>
    );
}
