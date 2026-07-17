import type { SupabaseClient } from "@supabase/supabase-js";
import type { DemoUser } from "@/domain/types";
import type { UserRepository } from "../contracts";

interface MembershipRow {
  user_id: string;
  tenant_id: string;
  role: DemoUser["role"];
  branch_ids: string[];
  created_at: string;
  updated_at: string;
  profiles: { name: string; email: string } | null;
}

export function userFromRow(row: MembershipRow): DemoUser {
  return {
    id: row.user_id,
    tenantId: row.tenant_id,
    name: row.profiles?.name ?? "",
    email: row.profiles?.email ?? "",
    role: row.role,
    branchIds: row.branch_ids,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// A DemoUser is a membership joined with its profile. Creating a brand-new
// employee (a new auth.users row) requires the admin API and a temporary
// password — same as resetMemberPassword — and is not implemented by save();
// this repository only updates an existing membership's role/branches.
export class SupabaseUserRepository implements UserRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(): Promise<DemoUser[]> {
    const { data, error } = await this.client
      .from("memberships")
      .select("user_id, tenant_id, role, branch_ids, created_at, updated_at, profiles(name, email)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => userFromRow(row as unknown as MembershipRow));
  }

  async getById(id: string): Promise<DemoUser | null> {
    const { data, error } = await this.client
      .from("memberships")
      .select("user_id, tenant_id, role, branch_ids, created_at, updated_at, profiles(name, email)")
      .eq("user_id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? userFromRow(data as unknown as MembershipRow) : null;
  }

  async save(entity: DemoUser): Promise<DemoUser> {
    const existing = await this.getById(entity.id);
    if (!existing) {
      throw new Error("การเพิ่มพนักงานใหม่ต้องเชิญผ่านระบบยืนยันตัวตน ยังไม่รองรับในหน้านี้");
    }

    const { error } = await this.client
      .from("memberships")
      .update({ role: entity.role, branch_ids: entity.branchIds })
      .eq("user_id", entity.id)
      .eq("tenant_id", entity.tenantId);
    if (error) throw new Error(error.message);

    const saved = await this.getById(entity.id);
    if (!saved) throw new Error("บันทึกข้อมูลพนักงานไม่สำเร็จ");
    return saved;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client.from("memberships").delete().eq("user_id", id);
    if (error) throw new Error(error.message);
  }
}
