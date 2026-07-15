import type { PlanId } from "./types";

export type MemberStatus = "PENDING" | "ACTIVE" | "SUSPENDED";
export type CreditRequestStatus = "PENDING" | "APPROVED" | "REJECTED";
export type CreditLedgerType = "TOP_UP" | "USAGE" | "REFUND" | "ADJUSTMENT";

export interface PlatformMember {
  id: string;
  tenantId: string;
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  status: MemberStatus;
  planId: PlanId;
  creditBalance: number;
  joinedAt: string;
  updatedAt: string;
}

export interface CreditTopUpRequest {
  id: string;
  reference: string;
  memberId: string;
  tenantId: string;
  requestedByEmail: string;
  amount: number;
  note?: string;
  status: CreditRequestStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNote?: string;
}

export interface CreditLedgerEntry {
  id: string;
  memberId: string;
  tenantId: string;
  type: CreditLedgerType;
  amount: number;
  balanceAfter: number;
  reference: string;
  description: string;
  createdAt: string;
  createdBy: string;
}

export interface CreditDataSnapshot {
  members: PlatformMember[];
  topUpRequests: CreditTopUpRequest[];
  ledger: CreditLedgerEntry[];
}
