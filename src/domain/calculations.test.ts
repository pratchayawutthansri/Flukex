import { describe, expect, it } from "vitest";
import { calculateLineTotal, calculateOrderTotals } from "./calculations";
import type { OrderItem } from "./types";

const item: OrderItem = {
  id: "line-1",
  productId: "product-1",
  productName: "ข้าวกะเพรา",
  station: "KITCHEN",
  quantity: 2,
  unitPrice: 100,
  modifiers: [{ id: "egg", name: "ไข่ดาว", price: 15 }],
  status: "WAITING",
};

describe("centralized order calculations", () => {
  it("calculates modifiers per quantity", () => {
    expect(calculateLineTotal(item)).toBe(230);
  });

  it("applies percentage discount, service charge and VAT in order", () => {
    expect(calculateOrderTotals([item], { discountType: "PERCENT", discountValue: 10, serviceChargeRate: 10, vatRate: 7 }))
      .toEqual({ subtotal: 230, discount: 23, serviceCharge: 20.7, vat: 15.94, grandTotal: 243.64 });
  });

  it("never discounts below zero", () => {
    expect(calculateOrderTotals([item], { discountType: "FIXED", discountValue: 1000 }).grandTotal).toBe(0);
  });
});
