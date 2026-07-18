import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/services/supabase/supabase-server";

const directCreditSchema = z.object({
  memberId: z.uuid(),
  amount: z.number().int().min(1).max(1_000_000),
  note: z.string().trim().max(300).optional(),
  idempotencyKey: z.uuid(),
});

interface DirectCreditRow {
  id: string;
  member_id: string;
  tenant_id: string;
  type: "TOP_UP";
  amount: number | string;
  balance_after: number | string;
  reference: string;
  description: string;
  created_at: string;
  created_by: string;
  idempotency_key: string;
}

async function getAdminClient() {
  const callerClient = await createServerSupabaseClient();
  const { data: userData } = await callerClient.auth.getUser();
  if (!userData.user) return { error: NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 }) };
  const { data: callerProfile } = await callerClient
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", userData.user.id)
    .single();
  if (!callerProfile?.is_platform_admin) {
    return { error: NextResponse.json({ message: "เฉพาะผู้ดูแลแพลตฟอร์มเท่านั้น" }, { status: 403 }) };
  }
  return { callerClient, user: userData.user };
}

export async function GET() {
  const auth = await getAdminClient();
  if (auth.error) return auth.error;
  const client = auth.callerClient;
  const [membersResult, requestsResult, ledgerResult, securityResult] = await Promise.all([
    client.from("platform_members").select("*").order("joined_at", { ascending: false }),
    client.from("credit_top_up_requests").select("*").order("created_at", { ascending: false }),
    client.from("credit_ledger_entries").select("*").order("created_at", { ascending: false }).limit(100),
    client.from("platform_security_events").select("*").order("created_at", { ascending: false }).limit(100),
  ]);
  const queryError = membersResult.error ?? requestsResult.error ?? ledgerResult.error ?? securityResult.error;
  if (queryError) return NextResponse.json({ message: queryError.message }, { status: 500 });

  return NextResponse.json({
    snapshot: {
      members: (membersResult.data ?? []).map((row) => ({
        id: row.id,
        tenantId: row.tenant_id,
        businessName: row.business_name,
        ownerName: row.owner_name,
        ownerEmail: row.owner_email,
        status: row.status,
        planId: row.plan_id,
        creditBalance: Number(row.credit_balance),
        joinedAt: row.joined_at,
        updatedAt: row.updated_at,
      })),
      topUpRequests: (requestsResult.data ?? []).map((row) => ({
        id: row.id,
        reference: row.reference,
        memberId: row.member_id,
        tenantId: row.tenant_id,
        requestedByEmail: row.requested_by_email,
        amount: Number(row.amount),
        note: row.note ?? undefined,
        status: row.status,
        createdAt: row.created_at,
        reviewedAt: row.reviewed_at ?? undefined,
        reviewedBy: row.reviewed_by ?? undefined,
        reviewNote: row.review_note ?? undefined,
      })),
      ledger: (ledgerResult.data ?? []).map((row) => ({
        id: row.id,
        memberId: row.member_id,
        tenantId: row.tenant_id,
        type: row.type,
        amount: Number(row.amount),
        balanceAfter: Number(row.balance_after),
        reference: row.reference,
        description: row.description,
        createdAt: row.created_at,
        createdBy: row.created_by,
        idempotencyKey: row.idempotency_key ?? undefined,
      })),
      securityEvents: (securityResult.data ?? []).map((row) => ({
        id: row.id,
        memberId: row.member_id,
        tenantId: row.tenant_id,
        type: row.type,
        createdAt: row.created_at,
        createdBy: row.created_by,
      })),
    },
  });
}

export async function POST(request: Request) {
  const auth = await getAdminClient();
  if (auth.error) return auth.error;
  const callerClient = auth.callerClient;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "ข้อมูลคำขอไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = directCreditSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({
      message: "กรุณาระบุสมาชิก จำนวนเครดิตเต็ม 1–1,000,000 และหมายเหตุไม่เกิน 300 ตัวอักษร",
    }, { status: 400 });
  }

  const { data, error } = await callerClient.rpc("platform_admin_add_credit", {
    p_member_id: parsed.data.memberId,
    p_amount: parsed.data.amount,
    p_note: parsed.data.note ?? null,
    p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) {
    const status = error.code === "42501" ? 403 : error.code === "P0002" ? 404 : 400;
    return NextResponse.json({ message: error.message }, { status });
  }

  const row = (data as DirectCreditRow[] | null)?.[0];
  if (!row) {
    return NextResponse.json({ message: "ไม่สามารถบันทึกรายการเครดิตได้" }, { status: 500 });
  }

  return NextResponse.json({
    entry: {
      id: row.id,
      memberId: row.member_id,
      tenantId: row.tenant_id,
      type: row.type,
      amount: Number(row.amount),
      balanceAfter: Number(row.balance_after),
      reference: row.reference,
      description: row.description,
      createdAt: row.created_at,
      createdBy: row.created_by,
      idempotencyKey: row.idempotency_key,
    },
  });
}
