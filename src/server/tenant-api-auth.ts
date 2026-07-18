import { NextResponse } from "next/server";
import type { UserRole } from "@/domain/types";
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
} from "@/services/supabase/supabase-server";

export async function requireTenantApiAccess(roles: readonly UserRole[]) {
  if (process.env.NEXT_PUBLIC_DATA_PROVIDER !== "supabase") {
    return {
      error: NextResponse.json(
        { message: "การตั้งค่า Integration จริงต้องเปิดใช้ Supabase data provider ก่อน Deploy" },
        { status: 503 },
      ),
    } as const;
  }

  const callerClient = await createServerSupabaseClient();
  const { data: userData } = await callerClient.auth.getUser();
  if (!userData.user) {
    return {
      error: NextResponse.json({ message: "กรุณาเข้าสู่ระบบใหม่" }, { status: 401 }),
    } as const;
  }

  const { data: membership } = await callerClient
    .from("memberships")
    .select("tenant_id, role, tenants(name)")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  const role = membership?.role as UserRole | undefined;
  if (!membership?.tenant_id || !role || !roles.includes(role)) {
    return {
      error: NextResponse.json({ message: "คุณไม่มีสิทธิ์จัดการ Integration นี้" }, { status: 403 }),
    } as const;
  }

  const tenantName = (membership.tenants as unknown as { name?: string } | null)?.name;
  const serviceClient = createServiceRoleSupabaseClient();
  const { data: subscription } = await serviceClient
    .from("subscriptions")
    .select("plan_id")
    .eq("tenant_id", membership.tenant_id)
    .maybeSingle();
  return {
    userId: userData.user.id,
    tenantId: membership.tenant_id as string,
    tenantName: tenantName ?? "ร้านอาหาร",
    role,
    planId: (subscription?.plan_id as string | undefined) ?? "free",
    serviceClient,
  } as const;
}
