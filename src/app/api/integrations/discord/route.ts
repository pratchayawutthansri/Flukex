import { NextResponse } from "next/server";
import {
  getDiscordWebhook,
  removeDiscordWebhook,
  saveDiscordWebhook,
} from "@/server/discord-integration";
import { sendDiscordWebhook } from "@/server/discord-webhook";
import { requireTenantApiAccess } from "@/server/tenant-api-auth";

const OWNER_ONLY = ["OWNER"] as const;

export async function GET() {
  const access = await requireTenantApiAccess(OWNER_ONLY);
  if ("error" in access) return access.error;

  try {
    const configured = await getDiscordWebhook(access.serviceClient, access.tenantId);
    return NextResponse.json({
      configured: Boolean(configured),
      managedByEnvironment: configured?.source === "environment",
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "อ่านการตั้งค่า Discord ไม่สำเร็จ" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const access = await requireTenantApiAccess(OWNER_ONLY);
  if ("error" in access) return access.error;
  if (access.planId !== "professional") {
    return NextResponse.json(
      { message: "Discord Webhook ใช้ได้ในแผน Professional" },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as { webhookUrl?: string };
    if (!body.webhookUrl) {
      return NextResponse.json({ message: "กรุณากรอก Discord Webhook URL" }, { status: 400 });
    }
    await saveDiscordWebhook(access.serviceClient, {
      tenantId: access.tenantId,
      userId: access.userId,
      webhookUrl: body.webhookUrl,
    });
    return NextResponse.json({ configured: true, managedByEnvironment: false });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "บันทึก Discord Webhook ไม่สำเร็จ" },
      { status: 400 },
    );
  }
}

export async function POST() {
  const access = await requireTenantApiAccess(OWNER_ONLY);
  if ("error" in access) return access.error;
  if (access.planId !== "professional") {
    return NextResponse.json(
      { message: "Discord Webhook ใช้ได้ในแผน Professional" },
      { status: 403 },
    );
  }

  try {
    const configured = await getDiscordWebhook(access.serviceClient, access.tenantId);
    if (!configured) {
      return NextResponse.json({ message: "ยังไม่ได้ตั้งค่า Discord Webhook" }, { status: 404 });
    }
    await sendDiscordWebhook(configured.url, {
      title: "ทดสอบการแจ้งเตือนสำเร็จ",
      message: "Discord Webhook เชื่อมต่อกับ Flukex POS เรียบร้อยแล้ว",
      restaurantName: access.tenantName,
    });
    return NextResponse.json({ delivered: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "ส่งข้อความทดสอบไม่สำเร็จ" },
      { status: 502 },
    );
  }
}

export async function DELETE() {
  const access = await requireTenantApiAccess(OWNER_ONLY);
  if ("error" in access) return access.error;

  try {
    await removeDiscordWebhook(access.serviceClient, access.tenantId);
    return NextResponse.json({ configured: false });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "ยกเลิก Discord Webhook ไม่สำเร็จ" },
      { status: 400 },
    );
  }
}
