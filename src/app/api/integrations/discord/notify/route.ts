import { NextResponse } from "next/server";
import { getDiscordWebhook } from "@/server/discord-integration";
import { sendDiscordWebhook } from "@/server/discord-webhook";
import { requireTenantApiAccess } from "@/server/tenant-api-auth";

const TENANT_ROLES = ["OWNER", "MANAGER", "CASHIER", "KITCHEN", "BAR"] as const;

export async function POST(request: Request) {
  const access = await requireTenantApiAccess(TENANT_ROLES);
  if ("error" in access) return access.error;
  if (access.planId !== "professional") {
    return NextResponse.json({ delivered: false, reason: "plan_not_allowed" });
  }

  try {
    const body = (await request.json()) as { title?: string; message?: string };
    if (!body.title || !body.message) {
      return NextResponse.json({ message: "ข้อมูลการแจ้งเตือนไม่ครบ" }, { status: 400 });
    }
    const configured = await getDiscordWebhook(access.serviceClient, access.tenantId);
    if (!configured) return NextResponse.json({ delivered: false, reason: "not_configured" });

    await sendDiscordWebhook(configured.url, {
      title: body.title,
      message: body.message,
      restaurantName: access.tenantName,
    });
    return NextResponse.json({ delivered: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "ส่ง Discord notification ไม่สำเร็จ" },
      { status: 502 },
    );
  }
}
