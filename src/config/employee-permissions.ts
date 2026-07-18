import type { UserRole } from "@/domain/types";

export const STAFF_ROLE_LABELS: Record<UserRole, string> = {
  OWNER: "เจ้าของร้าน",
  MANAGER: "ผู้จัดการร้าน",
  CASHIER: "แคชเชียร์",
  KITCHEN: "พนักงานครัว",
  BAR: "พนักงานบาร์",
};

const OPERATIONAL_ROLES = ["CASHIER", "KITCHEN", "BAR"] as const satisfies readonly UserRole[];
const OWNER_ASSIGNABLE_ROLES = ["MANAGER", ...OPERATIONAL_ROLES] as const satisfies readonly UserRole[];

export function getAssignableEmployeeRoles(actorRole: UserRole): readonly UserRole[] {
  if (actorRole === "OWNER") return OWNER_ASSIGNABLE_ROLES;
  if (actorRole === "MANAGER") return OPERATIONAL_ROLES;
  return [];
}

export function canManageEmployee(actorRole: UserRole, targetRole: UserRole) {
  if (targetRole === "OWNER") return false;
  return getAssignableEmployeeRoles(actorRole).includes(targetRole);
}

export function canDeleteEmployee(
  actorRole: UserRole,
  targetRole: UserRole,
  actorEmail: string,
  targetEmail: string,
) {
  if (actorEmail.trim().toLowerCase() === targetEmail.trim().toLowerCase()) return false;
  return canManageEmployee(actorRole, targetRole);
}
