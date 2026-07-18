import { describe, expect, it } from "vitest";
import type { Branch, Restaurant, RestaurantTable } from "./types";
import { isTableTokenAvailable, resolveQrTable } from "./qr-ordering";

const timestamp = "2026-07-18T00:00:00.000Z";
const restaurant: Restaurant = {
  id: "restaurant-1",
  tenantId: "tenant-1",
  name: "Flukex Bistro",
  slug: "flukex-bistro",
  phone: "",
  address: "",
  createdAt: timestamp,
  updatedAt: timestamp,
};
const branch: Branch = {
  id: "branch-1",
  tenantId: "tenant-1",
  restaurantId: restaurant.id,
  name: "Main",
  code: "MAIN",
  address: "",
  isActive: true,
  createdAt: timestamp,
  updatedAt: timestamp,
};
const table: RestaurantTable = {
  id: "table-1",
  tenantId: "tenant-1",
  branchId: branch.id,
  name: "โต๊ะ 01",
  token: "qr-table-01",
  seats: 4,
  status: "AVAILABLE",
  createdAt: timestamp,
  updatedAt: timestamp,
};

describe("QR table locking", () => {
  it("resolves a QR only when the restaurant, branch and table token match", () => {
    expect(resolveQrTable({
      restaurantSlug: restaurant.slug,
      tableToken: table.token,
      restaurants: [restaurant],
      branches: [branch],
      tables: [table],
    })).toEqual({ restaurant, table });
  });

  it("does not fall back to another table for an invalid token", () => {
    expect(resolveQrTable({
      restaurantSlug: restaurant.slug,
      tableToken: "invalid-token",
      restaurants: [restaurant],
      branches: [branch],
      tables: [table],
    })).toBeNull();
  });

  it("rejects a valid table token used with the wrong restaurant URL", () => {
    expect(resolveQrTable({
      restaurantSlug: "another-restaurant",
      tableToken: table.token,
      restaurants: [restaurant],
      branches: [branch],
      tables: [table],
    })).toBeNull();
  });

  it("rejects a table whose branch is not owned by the restaurant", () => {
    expect(resolveQrTable({
      restaurantSlug: restaurant.slug,
      tableToken: table.token,
      restaurants: [restaurant],
      branches: [{ ...branch, restaurantId: "restaurant-2" }],
      tables: [table],
    })).toBeNull();
  });

  it("enforces one unique QR token per table", () => {
    expect(isTableTokenAvailable([table], table.token)).toBe(false);
    expect(isTableTokenAvailable([table], table.token, table.id)).toBe(true);
    expect(isTableTokenAvailable([table], "qr-table-02")).toBe(true);
  });
});
