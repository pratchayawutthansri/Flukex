"use client";

import { useAuthSession } from "@/components/auth/auth-session-provider";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { ManagerOverview } from "@/components/dashboard/manager-overview";

export function RoleDashboard() {
  const { session } = useAuthSession();
  return session?.role === "MANAGER" ? <ManagerOverview /> : <DashboardOverview />;
}
