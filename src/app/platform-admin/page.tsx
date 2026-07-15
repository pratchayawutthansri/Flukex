import type { Metadata } from "next";
import { RoleGuard } from "@/components/auth/role-guard";
import { PlatformAdminDashboard } from "@/components/platform-admin/platform-admin-dashboard";

export const metadata: Metadata = { title: "Platform Admin", robots: { index: false, follow: false } };

export default function PlatformAdminPage() {
  return <RoleGuard><PlatformAdminDashboard /></RoleGuard>;
}
