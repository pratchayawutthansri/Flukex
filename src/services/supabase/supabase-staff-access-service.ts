import type { DemoUser, StaffJoinRequest } from "@/domain/types";
import type {
  StaffAccessDecisionInput,
  StaffAccessRequestInput,
  StaffAccessRequestReceipt,
  StaffAccessService,
} from "../contracts";
import { createBrowserSupabaseClient } from "./supabase-client";

interface StaffJoinRequestRow {
  id: string;
  tenant_id: string;
  applicant_user_id: string;
  applicant_name: string;
  applicant_email: string;
  restaurant_name: string;
  approver_email: string;
  status: StaffJoinRequest["status"];
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

function requestFromRow(row: StaffJoinRequestRow): StaffJoinRequest {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    applicantUserId: row.applicant_user_id,
    applicantName: row.applicant_name,
    applicantEmail: row.applicant_email,
    restaurantName: row.restaurant_name,
    approverEmail: row.approver_email,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reviewedAt: row.reviewed_at ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
  };
}

export class SupabaseStaffAccessService implements StaffAccessService {
  private readonly client = createBrowserSupabaseClient();

  async request(input: StaffAccessRequestInput): Promise<StaffAccessRequestReceipt> {
    const { data, error } = await this.client.auth.signUp({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      options: {
        data: {
          name: input.name.trim(),
          account_type: "STAFF",
          restaurant_name: input.restaurantName.trim(),
          approver_email: input.approverEmail.trim().toLowerCase(),
        },
      },
    });
    if (error) {
      if (error.message.includes("restaurant and approver")) {
        throw new Error("ไม่พบร้านที่ตรงกับชื่อร้านและอีเมลผู้อนุมัติ กรุณาตรวจสอบข้อมูลกับเจ้าของร้าน");
      }
      throw new Error(error.message);
    }
    if (!data.user || data.user.identities?.length === 0) {
      throw new Error("อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบหรือติดต่อผู้ดูแลร้าน");
    }

    if (data.session) await this.client.auth.signOut();
    return {
      id: data.user.id,
      applicantEmail: input.email.trim().toLowerCase(),
      restaurantName: input.restaurantName.trim(),
      status: "PENDING",
    };
  }

  async listPending(): Promise<StaffJoinRequest[]> {
    const { data, error } = await this.client
      .from("staff_join_requests")
      .select("id, tenant_id, applicant_user_id, applicant_name, applicant_email, restaurant_name, approver_email, status, created_at, updated_at, reviewed_at, reviewed_by")
      .eq("status", "PENDING")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => requestFromRow(row as StaffJoinRequestRow));
  }

  async approve(input: StaffAccessDecisionInput): Promise<DemoUser> {
    const { data, error } = await this.client.rpc("approve_staff_join_request", {
      p_request_id: input.requestId,
      p_role: input.role,
      p_branch_ids: input.branchIds,
    });
    if (error) {
      if (error.message.includes("subscription user limit")) {
        throw new Error("ถึงขีดจำกัดผู้ใช้ของแพ็กเกจแล้ว กรุณาเปลี่ยนแพ็กเกจก่อนอนุมัติพนักงาน");
      }
      throw new Error(error.message);
    }
    if (!data || typeof data !== "object") throw new Error("อนุมัติคำขอพนักงานไม่สำเร็จ");
    const user = data as Record<string, unknown>;
    return {
      id: String(user.id),
      tenantId: String(user.tenantId),
      name: String(user.name),
      email: String(user.email),
      role: input.role,
      branchIds: Array.isArray(user.branchIds) ? user.branchIds.map(String) : input.branchIds,
      createdAt: String(user.createdAt),
      updatedAt: String(user.updatedAt),
    };
  }

  async reject(requestId: string): Promise<void> {
    const { error } = await this.client.rpc("reject_staff_join_request", { p_request_id: requestId });
    if (error) throw new Error(error.message);
  }
}
