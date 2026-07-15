import { describe, expect, it } from "vitest";
import { applyCreditReview, createDefaultCreditData, createTopUpReference } from "./platform-store";

describe("credit approval workflow", () => {
  it("creates a traceable reference", () => {
    expect(createTopUpReference(new Date("2026-07-15T00:00:00.000Z"), 42)).toBe("TOPUP-20260715-0042");
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
});
