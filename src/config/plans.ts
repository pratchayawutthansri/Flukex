import type { PlanId } from "@/domain/types";

export interface PlanEntitlements {
  maxBranches: number;
  maxUsers: number;
  maxTables: number;
  maxProducts: number;
  monthlyOrderLimit: number;
  inventoryEnabled: boolean;
  advancedReportsEnabled: boolean;
  lineIntegrationEnabled: boolean;
  customDomainEnabled: boolean;
  externalWebhookEnabled: boolean;
}

export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  priceMonthly: number;
  description: string;
  highlighted?: boolean;
  features: string[];
  entitlements: PlanEntitlements;
}

export const SUBSCRIPTION_PLANS: Record<PlanId, SubscriptionPlan> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    description: "ทดลองระบบครบ flow สำหรับร้านขนาดเล็ก",
    features: ["1 สาขา", "5 โต๊ะ / 20 เมนู", "ผู้ใช้ 3 คน", "รายงานพื้นฐาน", "มีแบรนด์ระบบ"],
    entitlements: {
      maxBranches: 1,
      maxUsers: 3,
      maxTables: 5,
      maxProducts: 20,
      monthlyOrderLimit: 100,
      inventoryEnabled: false,
      advancedReportsEnabled: false,
      lineIntegrationEnabled: false,
      customDomainEnabled: false,
      externalWebhookEnabled: false,
    },
  },
  starter: {
    id: "starter",
    name: "Starter",
    priceMonthly: 1490,
    description: "ครบสำหรับร้านอาหารหนึ่งสาขาที่กำลังเติบโต",
    highlighted: true,
    features: ["POS + QR Ordering", "จอครัวและบาร์", "รายงานยอดขาย", "ส่วนลด VAT Service charge", "เอาแบรนด์ระบบออก"],
    entitlements: {
      maxBranches: 1,
      maxUsers: 15,
      maxTables: 40,
      maxProducts: 300,
      monthlyOrderLimit: 5000,
      inventoryEnabled: false,
      advancedReportsEnabled: false,
      lineIntegrationEnabled: false,
      customDomainEnabled: false,
      externalWebhookEnabled: false,
    },
  },
  professional: {
    id: "professional",
    name: "Professional",
    priceMonthly: 1990,
    description: "บริหารหลายสาขา พร้อมข้อมูลและสิทธิ์ขั้นสูง",
    features: ["หลายสาขา", "จัดการสต็อก", "รายงานขั้นสูง", "สิทธิ์พนักงานละเอียด", "รองรับ Integration ในอนาคต"],
    entitlements: {
      maxBranches: 10,
      maxUsers: 100,
      maxTables: 500,
      maxProducts: 2000,
      monthlyOrderLimit: 50000,
      inventoryEnabled: true,
      advancedReportsEnabled: true,
      lineIntegrationEnabled: true,
      customDomainEnabled: true,
      externalWebhookEnabled: true,
    },
  },
};

export function getEntitlements(planId: PlanId) {
  return SUBSCRIPTION_PLANS[planId].entitlements;
}

export function canUseFeature(planId: PlanId, feature: keyof PlanEntitlements) {
  return Boolean(getEntitlements(planId)[feature]);
}

export function isWithinLimit(
  planId: PlanId,
  limit: keyof Pick<PlanEntitlements, "maxBranches" | "maxUsers" | "maxTables" | "maxProducts" | "monthlyOrderLimit">,
  currentUsage: number,
) {
  return currentUsage < getEntitlements(planId)[limit];
}
