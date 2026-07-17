import { describe, expect, it } from "vitest";
import { userFromRow } from "./supabase-user-repository";

describe("userFromRow", () => {
  it("joins a membership row with its embedded profile", () => {
    const user = userFromRow({
      user_id: "auth_user_1",
      tenant_id: "tenant_1",
      role: "CASHIER",
      branch_ids: ["branch_1"],
      created_at: "2026-07-01T08:00:00.000Z",
      updated_at: "2026-07-01T08:00:00.000Z",
      profiles: { name: "คุณปาล์ม (แคชเชียร์)", email: "cashier@demo.com" },
    });

    expect(user).toEqual({
      id: "auth_user_1",
      tenantId: "tenant_1",
      name: "คุณปาล์ม (แคชเชียร์)",
      email: "cashier@demo.com",
      role: "CASHIER",
      branchIds: ["branch_1"],
      createdAt: "2026-07-01T08:00:00.000Z",
      updatedAt: "2026-07-01T08:00:00.000Z",
    });
  });

  it("falls back to empty name/email when the profile embed is missing", () => {
    const user = userFromRow({
      user_id: "auth_user_2",
      tenant_id: "tenant_1",
      role: "OWNER",
      branch_ids: [],
      created_at: "2026-07-01T08:00:00.000Z",
      updated_at: "2026-07-01T08:00:00.000Z",
      profiles: null,
    });

    expect(user.name).toBe("");
    expect(user.email).toBe("");
  });
});
