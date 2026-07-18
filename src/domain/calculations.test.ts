import { describe, expect, it } from "vitest";
import { calculateLineTotal, calculateOrderTotals, deriveOrderCalculationOptions } from "./calculations";
import type { Order, OrderItem, OrderTotals } from "./types";

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

function orderWithTotals(totals: OrderTotals): Pick<Order, "totals"> {
  return { totals };
}

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

  it("preserves an order with no service charge or VAT while editing", () => {
    const original = { subtotal: 230, discount: 0, serviceCharge: 0, vat: 0, grandTotal: 230 };
    expect(calculateOrderTotals([item], deriveOrderCalculationOptions(orderWithTotals(original)))).toEqual(original);
  });

  it("derives exclusive VAT and service charge from the original order", () => {
    const original = calculateOrderTotals([item], { discountType: "FIXED", discountValue: 20, serviceChargeRate: 10, vatRate: 7 });
    expect(calculateOrderTotals([item], deriveOrderCalculationOptions(orderWithTotals(original)))).toEqual(original);
  });

  it("derives VAT-inclusive pricing from the original order", () => {
    const original = calculateOrderTotals([item], { serviceChargeRate: 5, vatRate: 7, pricesIncludeVat: true });
    expect(calculateOrderTotals([item], deriveOrderCalculationOptions(orderWithTotals(original)))).toEqual(original);
  });
});
