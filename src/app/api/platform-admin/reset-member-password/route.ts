import { NextResponse } from "next/server";
import { generateTemporaryPassword } from "@/services/mock-auth-service";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/services/supabase/supabase-server";
import type { MemberPasswordResetInput } from "@/services/contracts";

export async function POST(request: Request) {
  const callerClient = await createServerSupabaseClient();
  const { data: userData } = await callerClient.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  const { data: callerProfile } = await callerClient
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", userData.user.id)
    .single();
  if (!callerProfile?.is_platform_admin) {
    return NextResponse.json({ message: "เฉพาะผู้ดูแลแพลตฟอร์มเท่านั้นที่รีเซ็ตรหัสสมาชิกได้" }, { status: 403 });
  }

  const input = (await request.json()) as MemberPasswordResetInput;
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) {
    return NextResponse.json({ message: "อีเมลสมาชิกไม่ถูกต้อง" }, { status: 400 });
  }

  const serviceClient = createServiceRoleSupabaseClient();

  const { data: targetProfile } = await serviceClient.from("profiles").select("id").eq("email", email).single();
  if (!targetProfile) {
    return NextResponse.json({ message: "ไม่พบสมาชิกด้วยอีเมลนี้" }, { status: 404 });
  }

  const temporaryPassword = generateTemporaryPassword();
  const { error: updateError } = await serviceClient.auth.admin.updateUserById(targetProfile.id, {
    password: temporaryPassword,
  });
  if (updateError) {
    return NextResponse.json({ message: updateError.message }, { status: 500 });
  }

  const { data: platformMember } = await serviceClient
    .from("platform_members")
    .select("id")
    .eq("tenant_id", input.tenantId)
    .single();
  if (platformMember) {
    await serviceClient.from("platform_security_events").insert({
      member_id: platformMember.id,
      tenant_id: input.tenantId,
      type: "PASSWORD_RESET",
      created_by: userData.user.email ?? userData.user.id,
    });
  }

  return NextResponse.json({ email, temporaryPassword });
}
