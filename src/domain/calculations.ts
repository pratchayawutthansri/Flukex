import type { Order, OrderItem, OrderTotals } from "@/domain/types";

export interface CalculationOptions {
  discountType?: "PERCENT" | "FIXED";
  discountValue?: number;
  vatRate?: number;
  serviceChargeRate?: number;
  pricesIncludeVat?: boolean;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateLineTotal(item: Pick<OrderItem, "quantity" | "unitPrice" | "modifiers">) {
  const modifiersTotal = item.modifiers.reduce((sum, modifier) => sum + modifier.price, 0);
  return roundMoney((item.unitPrice + modifiersTotal) * item.quantity);
}

export function calculateOrderTotals(items: OrderItem[], options: CalculationOptions = {}): OrderTotals {
  const subtotal = roundMoney(items.reduce((sum, item) => sum + calculateLineTotal(item), 0));
  const discountValue = Math.max(options.discountValue ?? 0, 0);
  const discount = roundMoney(
    options.discountType === "PERCENT"
      ? Math.min(subtotal, subtotal * Math.min(discountValue, 100) / 100)
      : Math.min(subtotal, discountValue),
  );
  const afterDiscount = subtotal - discount;
  const serviceCharge = roundMoney(afterDiscount * Math.max(options.serviceChargeRate ?? 0, 0) / 100);
  const taxableBase = afterDiscount + serviceCharge;
  const vatRate = Math.max(options.vatRate ?? 0, 0);
  const vat = roundMoney(
    options.pricesIncludeVat ? taxableBase - taxableBase / (1 + vatRate / 100) : taxableBase * vatRate / 100,
  );
  const grandTotal = roundMoney(options.pricesIncludeVat ? taxableBase : taxableBase + vat);

  return { subtotal, discount, serviceCharge, vat, grandTotal };
}

export function deriveOrderCalculationOptions(order: Pick<Order, "totals">): CalculationOptions {
  const { totals } = order;
  const afterDiscount = Math.max(totals.subtotal - totals.discount, 0);
  const taxableBase = afterDiscount + totals.serviceCharge;
  const exclusiveGrandTotal = taxableBase + totals.vat;
  const pricesIncludeVat = Math.abs(totals.grandTotal - taxableBase) <= Math.abs(totals.grandTotal - exclusiveGrandTotal);
  const serviceChargeRate = afterDiscount > 0 ? totals.serviceCharge / afterDiscount * 100 : 0;
  const vatBase = pricesIncludeVat ? taxableBase - totals.vat : taxableBase;
  const vatRate = vatBase > 0 ? totals.vat / vatBase * 100 : 0;

  return {
    discountType: "FIXED",
    discountValue: totals.discount,
    serviceChargeRate,
    vatRate,
    pricesIncludeVat,
  };
}
