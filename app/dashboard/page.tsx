import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth"; // Your Better-Auth instance
import { getDashboardData } from "@/data/dashboard";
import DashboardOverview from "@/components/dashboard/DashboardOverview";

export default async function DashboardPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    const dashboardData = await getDashboardData(session.user.id);

    return <DashboardOverview data={dashboardData} />;
}
