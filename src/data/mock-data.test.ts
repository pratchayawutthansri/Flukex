import { describe, expect, it } from "vitest";
import { createNewTenantData, DEMO_TENANT_ID } from "./mock-data";

describe("new tenant data", () => {
  it("creates an isolated empty workspace for a new restaurant", () => {
    const tenantId = "tenant_new_registration";
    const data = createNewTenantData({
      tenantId,
      ownerName: "คุณใหม่",
      ownerEmail: "new@example.com",
      restaurantName: "ร้านของคุณใหม่",
    });

    expect(data.restaurants[0]).toMatchObject({ tenantId, name: "ร้านของคุณใหม่" });
    expect(data.users[0]).toMatchObject({ tenantId, email: "new@example.com", role: "OWNER" });
    expect(data.branches[0]).toMatchObject({ tenantId, name: "สาขาหลัก" });
    expect(data.products).toEqual([]);
    expect(data.tables).toEqual([]);
    expect(data.orders).toEqual([]);
    expect(data.categories).toEqual([]);
  });

  it("never assigns the shared demo tenant to new entities", () => {
    const data = createNewTenantData({
      tenantId: "tenant_customer",
      ownerName: "Customer",
      ownerEmail: "customer@example.com",
      restaurantName: "Customer Restaurant",
    });
    const entities = [...data.users, ...data.restaurants, ...data.branches];

    expect(entities.every((entity) => entity.tenantId !== DEMO_TENANT_ID)).toBe(true);
  });
});
