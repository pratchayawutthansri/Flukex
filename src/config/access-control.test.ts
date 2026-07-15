import { describe, expect, it } from "vitest";
import { canAccessRoute, getRoleHome, getRoleInitials } from "./access-control";

describe("role-based access control", () => {
  it("routes every role to its own workspace", () => {
    expect(getRoleHome("OWNER")).toBe("/dashboard");
    expect(getRoleHome("CASHIER")).toBe("/cashier");
    expect(getRoleHome("KITCHEN")).toBe("/kitchen");
    expect(getRoleHome("BAR")).toBe("/bar");
    expect(getRoleHome("PLATFORM_ADMIN")).toBe("/platform-admin");
  });

  it("keeps owner-only settings and credits private", () => {
    expect(canAccessRoute("OWNER", "/dashboard/credits")).toBe(true);
    expect(canAccessRoute("OWNER", "/dashboard/subscription")).toBe(true);
    expect(canAccessRoute("MANAGER", "/dashboard/credits")).toBe(false);
    expect(canAccessRoute("CASHIER", "/dashboard/settings")).toBe(false);
  });

  it("lets managers operate without platform or billing access", () => {
    expect(canAccessRoute("MANAGER", "/dashboard/orders")).toBe(true);
    expect(canAccessRoute("MANAGER", "/dashboard/products")).toBe(true);
    expect(canAccessRoute("MANAGER", "/dashboard/integrations")).toBe(false);
    expect(canAccessRoute("MANAGER", "/platform-admin")).toBe(false);
  });

  it("isolates cashier, kitchen and bar workspaces", () => {
    expect(canAccessRoute("CASHIER", "/cashier")).toBe(true);
    expect(canAccessRoute("CASHIER", "/pos")).toBe(true);
    expect(canAccessRoute("CASHIER", "/dashboard")).toBe(false);
    expect(canAccessRoute("KITCHEN", "/kitchen")).toBe(true);
    expect(canAccessRoute("KITCHEN", "/bar")).toBe(false);
    expect(canAccessRoute("BAR", "/bar")).toBe(true);
  });

  it("derives a safe avatar initial", () => {
    expect(getRoleInitials("คุณมินตรา (เจ้าของร้าน)")).toBe("ค");
    expect(getRoleInitials(" Platform Admin ")).toBe("P");
  });
});
