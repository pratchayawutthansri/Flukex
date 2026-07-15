import type { Metadata } from "next";
import { RoleGuard } from "@/components/auth/role-guard";
import { CashierWorkspace } from "@/components/cashier/cashier-workspace";

export const metadata: Metadata = { title: "พื้นที่แคชเชียร์", robots: { index: false, follow: false } };

export default function CashierPage() {
  return <RoleGuard><CashierWorkspace /></RoleGuard>;
}
