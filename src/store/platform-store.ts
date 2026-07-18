"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEMO_TENANT_ID } from "@/data/mock-data";
import type {
  CreditDataSnapshot,
  CreditLedgerEntry,
  CreditRequestStatus,
  CreditTopUpRequest,
  PlatformMember,
  PlatformSecurityEvent,
} from "@/domain/credits";
import { createId } from "@/lib/utils";

const CREATED_AT = "2026-07-15T03:00:00.000Z";

export function createTopUpReference(now = new Date(), suffix = Math.floor(Math.random() * 10_000)) {
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `TOPUP-${date}-${String(suffix).padStart(4, "0")}`;
}

export function createAdminCreditReference(now = new Date(), suffix = Math.floor(Math.random() * 10_000)) {
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `ADMIN-TOPUP-${date}-${String(suffix).padStart(4, "0")}`;
}

interface DirectCreditInput {
  memberId: string;
  amount: number;
  operatorEmail: string;
  note?: string;
  createdAt: string;
  ledgerId: string;
  reference: string;
  idempotencyKey: string;
}

export function applyDirectCredit(state: CreditDataSnapshot, input: DirectCreditInput) {
  if (!Number.isSafeInteger(input.amount) || input.amount < 1 || input.amount > 1_000_000) {
    return { state, changed: false, error: "จำนวนเครดิตต้องเป็นเลขจำนวนเต็มตั้งแต่ 1 ถึง 1,000,000" } as const;
  }
  if (state.ledger.some((entry) => entry.idempotencyKey === input.idempotencyKey || entry.reference === input.reference)) {
    return { state, changed: false, error: "รายการนี้ถูกดำเนินการแล้ว" } as const;
  }

  const member = state.members.find((item) => item.id === input.memberId);
  if (!member) return { state, changed: false, error: "ไม่พบบัญชีสมาชิกร้านค้า" } as const;
  if (member.status !== "ACTIVE") {
    return { state, changed: false, error: "เติมเครดิตได้เฉพาะร้านที่เปิดใช้งานอยู่" } as const;
  }

  const nextBalance = member.creditBalance + input.amount;
  if (!Number.isSafeInteger(nextBalance)) {
    return { state, changed: false, error: "ยอดเครดิตหลังทำรายการไม่ถูกต้อง" } as const;
  }
  const ledgerEntry: CreditLedgerEntry = {
    id: input.ledgerId,
    memberId: member.id,
    tenantId: member.tenantId,
    type: "TOP_UP",
    amount: input.amount,
    balanceAfter: nextBalance,
    reference: input.reference,
    description: input.note?.trim() || "เติมเครดิตโดยผู้ดูแลแพลตฟอร์ม",
    createdAt: input.createdAt,
    createdBy: input.operatorEmail,
    idempotencyKey: input.idempotencyKey,
  };

  return {
    changed: true as const,
    ledgerEntry,
    state: {
      ...state,
      members: state.members.map((item) => item.id === member.id
        ? { ...item, creditBalance: nextBalance, updatedAt: input.createdAt }
        : item),
      ledger: [ledgerEntry, ...state.ledger],
    },
  };
}

export function createPasswordResetAuditEvent(
  member: PlatformMember,
  performedBy: string,
  createdAt = new Date().toISOString(),
  id = createId("security"),
): PlatformSecurityEvent {
  return {
    id,
    memberId: member.id,
    tenantId: member.tenantId,
    type: "PASSWORD_RESET",
    createdAt,
    createdBy: performedBy,
  };
}

export function createDefaultCreditData(): CreditDataSnapshot {
  return {
    members: [
      {
        id: "member_sawasdee",
        tenantId: DEMO_TENANT_ID,
        businessName: "สวัสดี บิสโทร",
        ownerName: "คุณมินตรา",
        ownerEmail: "owner@demo.com",
        status: "ACTIVE",
        planId: "starter",
        creditBalance: 850,
        joinedAt: "2026-07-01T08:00:00.000Z",
        updatedAt: CREATED_AT,
      },
      {
        id: "member_riverside",
        tenantId: "tenant_riverside_cafe",
        businessName: "Riverside Cafe",
        ownerName: "คุณอร",
        ownerEmail: "owner@riverside.demo",
        status: "ACTIVE",
        planId: "free",
        creditBalance: 120,
        joinedAt: "2026-07-10T09:30:00.000Z",
        updatedAt: CREATED_AT,
      },
      {
        id: "member_new_shop",
        tenantId: "tenant_new_shop",
        businessName: "ครัวบ้านสวน",
        ownerName: "คุณปิยะ",
        ownerEmail: "owner@newshop.demo",
        status: "PENDING",
        planId: "free",
        creditBalance: 0,
        joinedAt: "2026-07-15T02:20:00.000Z",
        updatedAt: CREATED_AT,
      },
    ],
    topUpRequests: [
      {
        id: "topup_riverside_001",
        reference: "TOPUP-20260715-0001",
        memberId: "member_riverside",
        tenantId: "tenant_riverside_cafe",
        requestedByEmail: "owner@riverside.demo",
        amount: 500,
        note: "ส่งหลักฐานทาง LINE แล้ว",
        status: "PENDING",
        createdAt: "2026-07-15T04:10:00.000Z",
      },
    ],
    ledger: [
      {
        id: "ledger_sawasdee_usage",
        memberId: "member_sawasdee",
        tenantId: DEMO_TENANT_ID,
        type: "USAGE",
        amount: -150,
        balanceAfter: 850,
        reference: "USAGE-202607",
        description: "ค่าบริการแพ็กเกจ Starter เดือนกรกฎาคม",
        createdAt: "2026-07-15T03:00:00.000Z",
        createdBy: "system",
      },
      {
        id: "ledger_sawasdee_topup",
        memberId: "member_sawasdee",
        tenantId: DEMO_TENANT_ID,
        type: "TOP_UP",
        amount: 1_000,
        balanceAfter: 1_000,
        reference: "TOPUP-20260701-0001",
        description: "เติมเครดิตผ่าน LINE",
        createdAt: "2026-07-01T08:30:00.000Z",
        createdBy: "admin@flukex.demo",
      },
    ],
    securityEvents: [],
  };
}

interface ReviewInput {
  requestId: string;
  decision: Exclude<CreditRequestStatus, "PENDING">;
  reviewerEmail: string;
  reviewNote?: string;
  reviewedAt: string;
  ledgerId: string;
}

export function applyCreditReview(state: CreditDataSnapshot, input: ReviewInput) {
  const request = state.topUpRequests.find((item) => item.id === input.requestId);
  if (!request || request.status !== "PENDING") return { state, changed: false };

  const member = state.members.find((item) => item.id === request.memberId);
  if (!member) return { state, changed: false };

  const reviewedRequest: CreditTopUpRequest = {
    ...request,
    status: input.decision,
    reviewedAt: input.reviewedAt,
    reviewedBy: input.reviewerEmail,
    reviewNote: input.reviewNote?.trim() || undefined,
  };

  if (input.decision === "REJECTED") {
    return {
      changed: true,
      state: {
        ...state,
        topUpRequests: state.topUpRequests.map((item) => item.id === request.id ? reviewedRequest : item),
      },
    };
  }

  const nextBalance = member.creditBalance + request.amount;
  const ledgerEntry: CreditLedgerEntry = {
    id: input.ledgerId,
    memberId: member.id,
    tenantId: member.tenantId,
    type: "TOP_UP",
    amount: request.amount,
    balanceAfter: nextBalance,
    reference: request.reference,
    description: "อนุมัติการเติมเครดิตผ่าน LINE",
    createdAt: input.reviewedAt,
    createdBy: input.reviewerEmail,
  };

  return {
    changed: true,
    state: {
      members: state.members.map((item) => item.id === member.id ? { ...item, creditBalance: nextBalance, updatedAt: input.reviewedAt } : item),
      topUpRequests: state.topUpRequests.map((item) => item.id === request.id ? reviewedRequest : item),
      ledger: [ledgerEntry, ...state.ledger],
      securityEvents: state.securityEvents,
    },
  };
}

interface PlatformStore extends CreditDataSnapshot {
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  hydratePlatformData: (snapshot: CreditDataSnapshot) => void;
  requestTopUp: (input: { memberId: string; amount: number; requestedByEmail: string; note?: string }) => CreditTopUpRequest;
  registerMember: (input: { tenantId: string; businessName: string; ownerName: string; ownerEmail: string }) => PlatformMember;
  reviewTopUp: (input: Omit<ReviewInput, "reviewedAt" | "ledgerId">) => boolean;
  addCreditDirectly: (input: { memberId: string; amount: number; operatorEmail: string; note?: string; idempotencyKey: string }) => CreditLedgerEntry;
  applyServerCredit: (entry: CreditLedgerEntry) => void;
  setMemberStatus: (memberId: string, status: PlatformMember["status"]) => void;
  recordPasswordReset: (input: { memberId: string; performedBy: string }) => PlatformSecurityEvent;
  resetPlatformData: () => void;
}

export const usePlatformStore = create<PlatformStore>()(
  persist(
    (set, get) => ({
      ...createDefaultCreditData(),
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      hydratePlatformData: (snapshot) => set({ ...snapshot, hydrated: true }),
      registerMember: (input) => {
        const existing = get().members.find((member) => member.tenantId === input.tenantId || member.ownerEmail === input.ownerEmail);
        if (existing) return existing;
        const now = new Date().toISOString();
        const member: PlatformMember = {
          id: createId("member"),
          tenantId: input.tenantId,
          businessName: input.businessName,
          ownerName: input.ownerName,
          ownerEmail: input.ownerEmail,
          status: "PENDING",
          planId: "free",
          creditBalance: 0,
          joinedAt: now,
          updatedAt: now,
        };
        set((state) => ({ members: [member, ...state.members] }));
        return member;
      },
      requestTopUp: ({ memberId, amount, requestedByEmail, note }) => {
        const member = get().members.find((item) => item.id === memberId);
        if (!member) throw new Error("ไม่พบบัญชีสมาชิกร้านค้า");
        if (!Number.isInteger(amount) || amount < 100) throw new Error("ยอดเติมขั้นต่ำคือ 100 เครดิต");
        const createdAt = new Date().toISOString();
        const request: CreditTopUpRequest = {
          id: createId("topup"),
          reference: createTopUpReference(new Date(createdAt)),
          memberId,
          tenantId: member.tenantId,
          requestedByEmail,
          amount,
          note: note?.trim() || undefined,
          status: "PENDING",
          createdAt,
        };
        set((state) => ({ topUpRequests: [request, ...state.topUpRequests] }));
        return request;
      },
      reviewTopUp: (input) => {
        const snapshot = get();
        const result = applyCreditReview(snapshot, {
          ...input,
          reviewedAt: new Date().toISOString(),
          ledgerId: createId("ledger"),
        });
        if (!result.changed) return false;
        set(result.state);
        return true;
      },
      addCreditDirectly: (input) => {
        const createdAt = new Date().toISOString();
        const result = applyDirectCredit(get(), {
          ...input,
          createdAt,
          ledgerId: createId("ledger"),
          reference: createAdminCreditReference(new Date(createdAt)),
        });
        if (!result.changed) throw new Error(result.error);
        set(result.state);
        return result.ledgerEntry;
      },
      applyServerCredit: (entry) => set((state) => {
        if (state.ledger.some((item) => item.id === entry.id || item.idempotencyKey === entry.idempotencyKey)) return state;
        return {
          members: state.members.map((member) => member.id === entry.memberId
            ? { ...member, creditBalance: entry.balanceAfter, updatedAt: entry.createdAt }
            : member),
          ledger: [entry, ...state.ledger],
        };
      }),
      setMemberStatus: (memberId, status) => set((state) => ({
        members: state.members.map((member) => member.id === memberId ? { ...member, status, updatedAt: new Date().toISOString() } : member),
      })),
      recordPasswordReset: ({ memberId, performedBy }) => {
        const member = get().members.find((item) => item.id === memberId);
        if (!member) throw new Error("ไม่พบบัญชีสมาชิกร้านค้า");
        const event = createPasswordResetAuditEvent(member, performedBy);
        set((state) => ({ securityEvents: [event, ...state.securityEvents] }));
        return event;
      },
      resetPlatformData: () => set({ ...createDefaultCreditData() }),
    }),
    {
      name: "flukex-pos:platform-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        members: state.members,
        topUpRequests: state.topUpRequests,
        ledger: state.ledger,
        securityEvents: state.securityEvents,
      }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);
