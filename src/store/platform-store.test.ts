import { describe, expect, it } from "vitest";
import {
  applyCreditReview,
  applyDirectCredit,
  createAdminCreditReference,
  createDefaultCreditData,
  createPasswordResetAuditEvent,
  createTopUpReference,
} from "./platform-store";

describe("credit approval workflow", () => {
  it("creates a traceable reference", () => {
    expect(createTopUpReference(new Date("2026-07-15T00:00:00.000Z"), 42)).toBe("TOPUP-20260715-0042");
  });

  it("creates a traceable admin credit reference", () => {
    expect(createAdminCreditReference(new Date("2026-07-18T00:00:00.000Z"), 7)).toBe("ADMIN-TOPUP-20260718-0007");
  });

  it("lets platform admin add credit directly once and records the operator", () => {
    const initial = createDefaultCreditData();
    const result = applyDirectCredit(initial, {
      memberId: "member_sawasdee",
      amount: 2_000,
      operatorEmail: "admin@flukex.demo",
      note: "รับยอดจาก LINE แล้ว",
      createdAt: "2026-07-18T08:00:00.000Z",
      ledgerId: "ledger_admin_topup",
      reference: "ADMIN-TOPUP-20260718-0007",
      idempotencyKey: "credit-action-001",
    });

    expect(result.changed).toBe(true);
    expect(result.state.members[0].creditBalance).toBe(2_850);
    expect(result.state.ledger[0]).toMatchObject({
      amount: 2_000,
      balanceAfter: 2_850,
      createdBy: "admin@flukex.demo",
      idempotencyKey: "credit-action-001",
    });

    const duplicate = applyDirectCredit(result.state, {
      memberId: "member_sawasdee",
      amount: 2_000,
      operatorEmail: "admin@flukex.demo",
      createdAt: "2026-07-18T08:01:00.000Z",
      ledgerId: "ledger_duplicate",
      reference: "ADMIN-TOPUP-20260718-0008",
      idempotencyKey: "credit-action-001",
    });
    expect(duplicate.changed).toBe(false);
    expect(duplicate.state.ledger).toHaveLength(result.state.ledger.length);
  });

  it("rejects invalid amounts and suspended members", () => {
    const initial = createDefaultCreditData();
    expect(applyDirectCredit(initial, {
      memberId: "member_sawasdee",
      amount: 1.5,
      operatorEmail: "admin@flukex.demo",
      createdAt: "2026-07-18T08:00:00.000Z",
      ledgerId: "ledger_invalid",
      reference: "ADMIN-TOPUP-INVALID",
      idempotencyKey: "invalid-amount",
    }).changed).toBe(false);

    const suspended = {
      ...initial,
      members: initial.members.map((member) => member.id === "member_sawasdee" ? { ...member, status: "SUSPENDED" as const } : member),
    };
    expect(applyDirectCredit(suspended, {
      memberId: "member_sawasdee",
      amount: 500,
      operatorEmail: "admin@flukex.demo",
      createdAt: "2026-07-18T08:00:00.000Z",
      ledgerId: "ledger_suspended",
      reference: "ADMIN-TOPUP-SUSPENDED",
      idempotencyKey: "suspended-member",
    }).changed).toBe(false);
  });

  it("approves a pending request once and writes the ledger", () => {
    const initial = createDefaultCreditData();
    const result = applyCreditReview(initial, {
      requestId: "topup_riverside_001",
      decision: "APPROVED",
      reviewerEmail: "admin@flukex.demo",
      reviewedAt: "2026-07-15T05:00:00.000Z",
      ledgerId: "ledger_test",
    });

    expect(result.changed).toBe(true);
    expect(result.state.members.find((item) => item.id === "member_riverside")?.creditBalance).toBe(620);
    expect(result.state.ledger[0]).toMatchObject({
      id: "ledger_test",
      amount: 500,
      balanceAfter: 620,
      reference: "TOPUP-20260715-0001",
    });

    const duplicate = applyCreditReview(result.state, {
      requestId: "topup_riverside_001",
      decision: "APPROVED",
      reviewerEmail: "admin@flukex.demo",
      reviewedAt: "2026-07-15T05:01:00.000Z",
      ledgerId: "ledger_duplicate",
    });
    expect(duplicate.changed).toBe(false);
    expect(duplicate.state.ledger).toHaveLength(result.state.ledger.length);
  });

  it("rejects without changing balance or ledger", () => {
    const initial = createDefaultCreditData();
    const result = applyCreditReview(initial, {
      requestId: "topup_riverside_001",
      decision: "REJECTED",
      reviewerEmail: "admin@flukex.demo",
      reviewedAt: "2026-07-15T05:00:00.000Z",
      ledgerId: "unused",
      reviewNote: "ยังไม่พบหลักฐานใน LINE",
    });

    expect(result.changed).toBe(true);
    expect(result.state.members.find((item) => item.id === "member_riverside")?.creditBalance).toBe(120);
    expect(result.state.ledger).toHaveLength(initial.ledger.length);
    expect(result.state.topUpRequests[0].status).toBe("REJECTED");
  });

  it("records a password reset without storing the temporary password", () => {
    const member = createDefaultCreditData().members[0];
    const event = createPasswordResetAuditEvent(
      member,
      "admin@flukex.demo",
      "2026-07-15T10:00:00.000Z",
      "security_test",
    );

    expect(event).toEqual({
      id: "security_test",
      memberId: member.id,
      tenantId: member.tenantId,
      type: "PASSWORD_RESET",
      createdAt: "2026-07-15T10:00:00.000Z",
      createdBy: "admin@flukex.demo",
    });
    expect(event).not.toHaveProperty("password");
  });
});
