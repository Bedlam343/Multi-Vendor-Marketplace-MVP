import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth"; // Your Better-Auth instance
import { getDashboardData } from "@/data/dashboard";
import DashboardOverview from "@/components/dashboard/DashboardOverview";

export default async function DashboardPage() {
    // 1. Auth Check (The Gatekeeper)
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    // 2. Data Fetch (The Conductor)
    // This runs the 5 parallel queries we defined in data/dashboard.ts
    const dashboardData = await getDashboardData(session.user.id);

    // 3. Render View
    return <DashboardOverview data={dashboardData} />;
}
