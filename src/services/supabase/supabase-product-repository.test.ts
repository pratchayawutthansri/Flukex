import { describe, expect, it } from "vitest";
import { productFromRow } from "./supabase-product-repository";

describe("productFromRow", () => {
  it("maps snake_case columns and embedded modifiers to the Product shape", () => {
    const product = productFromRow({
      id: "product_1",
      tenant_id: "tenant_1",
      category_id: "cat_1",
      name: "กะเพราเนื้อวากิวไข่ดาว",
      description: "desc",
      price: 189,
      image_url: "/products/krapao.svg",
      station: "KITCHEN",
      is_available: true,
      is_sold_out: false,
      created_at: "2026-07-01T08:00:00.000Z",
      updated_at: "2026-07-01T08:00:00.000Z",
      product_modifiers: [{ id: "mod_egg", name: "เพิ่มไข่ดาว", price: 15 }],
    });

    expect(product).toEqual({
      id: "product_1",
      tenantId: "tenant_1",
      categoryId: "cat_1",
      name: "กะเพราเนื้อวากิวไข่ดาว",
      description: "desc",
      price: 189,
      imageUrl: "/products/krapao.svg",
      station: "KITCHEN",
      isAvailable: true,
      isSoldOut: false,
      modifiers: [{ id: "mod_egg", name: "เพิ่มไข่ดาว", price: 15 }],
      createdAt: "2026-07-01T08:00:00.000Z",
      updatedAt: "2026-07-01T08:00:00.000Z",
    });
  });

  it("defaults modifiers to an empty array when the embed is null", () => {
    const product = productFromRow({
      id: "product_2",
      tenant_id: "tenant_1",
      category_id: "cat_1",
      name: "แกงเขียวหวานไก่",
      description: "desc",
      price: 149,
      image_url: "/products/green-curry.svg",
      station: "KITCHEN",
      is_available: true,
      is_sold_out: false,
      created_at: "2026-07-01T08:00:00.000Z",
      updated_at: "2026-07-01T08:00:00.000Z",
      product_modifiers: null,
    });

    expect(product.modifiers).toEqual([]);
  });
});
