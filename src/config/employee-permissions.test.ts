import { describe, expect, it } from "vitest";
import {
  canDeleteEmployee,
  canManageEmployee,
  getAssignableEmployeeRoles,
} from "./employee-permissions";

describe("employee permissions", () => {
  it("lets owners manage managers and operational staff, but not another owner", () => {
    expect(getAssignableEmployeeRoles("OWNER")).toEqual(["MANAGER", "CASHIER", "KITCHEN", "BAR"]);
    expect(canManageEmployee("OWNER", "MANAGER")).toBe(true);
    expect(canManageEmployee("OWNER", "OWNER")).toBe(false);
  });

  it("limits managers to operational staff", () => {
    expect(getAssignableEmployeeRoles("MANAGER")).toEqual(["CASHIER", "KITCHEN", "BAR"]);
    expect(canManageEmployee("MANAGER", "CASHIER")).toBe(true);
    expect(canManageEmployee("MANAGER", "MANAGER")).toBe(false);
    expect(canManageEmployee("MANAGER", "OWNER")).toBe(false);
  });

  it("prevents users from deleting themselves", () => {
    expect(canDeleteEmployee("OWNER", "MANAGER", "owner@example.com", "owner@example.com")).toBe(false);
    expect(canDeleteEmployee("MANAGER", "CASHIER", "manager@example.com", "cashier@example.com")).toBe(true);
  });
});
