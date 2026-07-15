import type { SessionRole } from "@/domain/types";

export interface RoleDefinition {
  code: SessionRole;
  label: string;
  shortLabel: string;
  description: string;
  home: string;
}

export const ROLE_DEFINITIONS: Record<SessionRole, RoleDefinition> = {
  PLATFORM_ADMIN: {
    code: "PLATFORM_ADMIN",
    label: "ผู้ดูแลแพลตฟอร์ม",
    shortLabel: "Platform Admin",
    description: "จัดการสมาชิก ร้านค้า เครดิต และคำขอเติมเครดิต",
    home: "/platform-admin",
  },
  OWNER: {
    code: "OWNER",
    label: "เจ้าของร้าน",
    shortLabel: "Owner",
    description: "บริหารร้าน รายงาน พนักงาน แพ็กเกจ และเครดิต",
    home: "/dashboard",
  },
  MANAGER: {
    code: "MANAGER",
    label: "ผู้จัดการร้าน",
    shortLabel: "Manager",
    description: "ควบคุมงานประจำวัน ออเดอร์ เมนู โต๊ะ และทีมงาน",
    home: "/dashboard",
  },
  CASHIER: {
    code: "CASHIER",
    label: "แคชเชียร์",
    shortLabel: "Cashier",
    description: "ดูภาพรวมกะ รับออเดอร์ และชำระเงินผ่าน POS",
    home: "/cashier",
  },
  KITCHEN: {
    code: "KITCHEN",
    label: "พนักงานครัว",
    shortLabel: "Kitchen",
    description: "รับรายการอาหารและอัปเดตสถานะการปรุง",
    home: "/kitchen",
  },
  BAR: {
    code: "BAR",
    label: "พนักงานบาร์",
    shortLabel: "Bar",
    description: "รับรายการเครื่องดื่มและส่งต่อให้พนักงานเสิร์ฟ",
    home: "/bar",
  },
};

interface RouteRule {
  pattern: string;
  roles: readonly SessionRole[];
}

const OWNER_MANAGER = ["OWNER", "MANAGER"] as const satisfies readonly SessionRole[];

const ROUTE_RULES: readonly RouteRule[] = [
  { pattern: "/platform-admin/*", roles: ["PLATFORM_ADMIN"] },
  { pattern: "/cashier/*", roles: ["CASHIER"] },
  { pattern: "/dashboard/credits/*", roles: ["OWNER"] },
  { pattern: "/dashboard/subscription/*", roles: ["OWNER"] },
  { pattern: "/dashboard/integrations/*", roles: ["OWNER"] },
  { pattern: "/dashboard/settings/*", roles: ["OWNER"] },
  { pattern: "/dashboard/branches/*", roles: ["OWNER"] },
  { pattern: "/dashboard/restaurant/*", roles: ["OWNER"] },
  { pattern: "/dashboard/employees/*", roles: OWNER_MANAGER },
  { pattern: "/dashboard/categories/*", roles: OWNER_MANAGER },
  { pattern: "/dashboard/products/*", roles: OWNER_MANAGER },
  { pattern: "/dashboard/tables/*", roles: OWNER_MANAGER },
  { pattern: "/dashboard/orders/*", roles: OWNER_MANAGER },
  { pattern: "/dashboard/reports/*", roles: OWNER_MANAGER },
  { pattern: "/dashboard", roles: OWNER_MANAGER },
  { pattern: "/dashboard/*", roles: ["OWNER"] },
  { pattern: "/pos/*", roles: ["OWNER", "MANAGER", "CASHIER"] },
  { pattern: "/kitchen/*", roles: ["OWNER", "MANAGER", "KITCHEN"] },
  { pattern: "/bar/*", roles: ["OWNER", "MANAGER", "BAR"] },
];

function normalizePath(pathname: string) {
  const cleanPath = pathname.split(/[?#]/, 1)[0] || "/";
  return cleanPath.length > 1 ? cleanPath.replace(/\/$/, "") : cleanPath;
}

function matchesRoute(pathname: string, pattern: string) {
  const normalizedPath = normalizePath(pathname);
  if (!pattern.endsWith("/*")) return normalizedPath === pattern;
  const base = pattern.slice(0, -2);
  return normalizedPath === base || normalizedPath.startsWith(`${base}/`);
}

export function getRoleHome(role: SessionRole) {
  return ROLE_DEFINITIONS[role].home;
}

export function canAccessRoute(role: SessionRole, pathname: string) {
  const rule = ROUTE_RULES.find((candidate) => matchesRoute(pathname, candidate.pattern));
  return Boolean(rule?.roles.includes(role));
}

export function isOperationalRoute(pathname: string) {
  return ROUTE_RULES.some((rule) => matchesRoute(pathname, rule.pattern));
}

export function getRoleInitials(name: string) {
  const cleaned = name.replace(/\([^)]*\)/g, "").trim();
  return cleaned.charAt(0).toUpperCase() || "U";
}
