import { describe, expect, it } from "vitest";
import { orderFromRow } from "./supabase-order-repository";

describe("orderFromRow", () => {
  it("flattens total columns back into an OrderTotals object and maps items", () => {
    const order = orderFromRow({
      id: "order_1042",
      tenant_id: "tenant_1",
      branch_id: "branch_1",
      table_id: "table_02",
      table_name: "โต๊ะ 02",
      order_number: "#1042",
      source: "QR",
      status: "PREPARING",
      subtotal: 548,
      discount: 0,
      service_charge: 54.8,
      vat: 42.2,
      grand_total: 645,
      payment_method: null,
      paid_at: null,
      created_at: "2026-07-15T05:18:00.000Z",
      updated_at: "2026-07-15T05:22:00.000Z",
      order_items: [
        {
          id: "item_1",
          product_id: "product_krapao",
          product_name: "กะเพราเนื้อวากิวไข่ดาว",
          station: "KITCHEN",
          quantity: 2,
          unit_price: 189,
          modifiers: [],
          note: "ไม่ใส่ถั่วฝักยาว",
          status: "PREPARING",
        },
      ],
    });

    expect(order.totals).toEqual({ subtotal: 548, discount: 0, serviceCharge: 54.8, vat: 42.2, grandTotal: 645 });
    expect(order.items).toEqual([
      {
        id: "item_1",
        productId: "product_krapao",
        productName: "กะเพราเนื้อวากิวไข่ดาว",
        station: "KITCHEN",
        quantity: 2,
        unitPrice: 189,
        modifiers: [],
        note: "ไม่ใส่ถั่วฝักยาว",
        status: "PREPARING",
      },
    ]);
    expect(order.paymentMethod).toBeUndefined();
    expect(order.paidAt).toBeUndefined();
  });

  it("defaults order_items to an empty array when the embed is null", () => {
    const order = orderFromRow({
      id: "order_1",
      tenant_id: "tenant_1",
      branch_id: "branch_1",
      table_id: "table_01",
      table_name: "โต๊ะ 01",
      order_number: "#1",
      source: "POS",
      status: "WAITING",
      subtotal: 0,
      discount: 0,
      service_charge: 0,
      vat: 0,
      grand_total: 0,
      payment_method: "CASH",
      paid_at: "2026-07-15T04:52:00.000Z",
      created_at: "2026-07-15T04:30:00.000Z",
      updated_at: "2026-07-15T04:52:00.000Z",
      order_items: null,
    });

    expect(order.items).toEqual([]);
    expect(order.paymentMethod).toBe("CASH");
  });
});
