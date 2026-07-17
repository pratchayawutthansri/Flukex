import type { SupabaseClient } from "@supabase/supabase-js";
import type { Order, OrderItem, ProductModifier } from "@/domain/types";
import type { OrderRepository } from "../contracts";

interface OrderRow {
  id: string;
  tenant_id: string;
  branch_id: string;
  table_id: string;
  table_name: string;
  order_number: string;
  source: Order["source"];
  status: Order["status"];
  subtotal: number;
  discount: number;
  service_charge: number;
  vat: number;
  grand_total: number;
  payment_method: Order["paymentMethod"] | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  order_items: OrderItemRow[] | null;
}

interface OrderItemRow {
  id: string;
  product_id: string;
  product_name: string;
  station: OrderItem["station"];
  quantity: number;
  unit_price: number;
  modifiers: ProductModifier[] | null;
  note: string | null;
  status: OrderItem["status"];
}

export function orderFromRow(row: OrderRow): Order {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    branchId: row.branch_id,
    tableId: row.table_id,
    tableName: row.table_name,
    orderNumber: row.order_number,
    source: row.source,
    status: row.status,
    items: (row.order_items ?? []).map((item): OrderItem => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      station: item.station,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      modifiers: item.modifiers ?? [],
      note: item.note ?? undefined,
      status: item.status,
    })),
    totals: {
      subtotal: row.subtotal,
      discount: row.discount,
      serviceCharge: row.service_charge,
      vat: row.vat,
      grandTotal: row.grand_total,
    },
    paymentMethod: row.payment_method ?? undefined,
    paidAt: row.paid_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseOrderRepository implements OrderRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(): Promise<Order[]> {
    const { data, error } = await this.client
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => orderFromRow(row as OrderRow));
  }

  async getById(id: string): Promise<Order | null> {
    const { data, error } = await this.client.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? orderFromRow(data as OrderRow) : null;
  }

  async save(entity: Order): Promise<Order> {
    const existing = await this.getById(entity.id);

    const { error: orderError } = await this.client.from("orders").upsert({
      id: entity.id,
      tenant_id: entity.tenantId,
      branch_id: entity.branchId,
      table_id: entity.tableId,
      table_name: entity.tableName,
      order_number: entity.orderNumber,
      source: entity.source,
      status: entity.status,
      subtotal: entity.totals.subtotal,
      discount: entity.totals.discount,
      service_charge: entity.totals.serviceCharge,
      vat: entity.totals.vat,
      grand_total: entity.totals.grandTotal,
      payment_method: entity.paymentMethod ?? null,
      paid_at: entity.paidAt ?? null,
    });
    if (orderError) throw new Error(orderError.message);

    const { error: deleteItemsError } = await this.client.from("order_items").delete().eq("order_id", entity.id);
    if (deleteItemsError) throw new Error(deleteItemsError.message);

    if (entity.items.length > 0) {
      const { error: insertItemsError } = await this.client.from("order_items").insert(
        entity.items.map((item) => ({
          id: item.id,
          order_id: entity.id,
          product_id: item.productId,
          product_name: item.productName,
          station: item.station,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          modifiers: item.modifiers,
          note: item.note ?? null,
          status: item.status,
        })),
      );
      if (insertItemsError) throw new Error(insertItemsError.message);
    }

    if (!existing || existing.status !== entity.status) {
      const { error: eventError } = await this.client
        .from("order_status_events")
        .insert({ order_id: entity.id, status: entity.status });
      if (eventError) throw new Error(eventError.message);
    }

    if (entity.paymentMethod && entity.paidAt) {
      const { error: paymentError } = await this.client.from("payments").upsert(
        {
          order_id: entity.id,
          tenant_id: entity.tenantId,
          method: entity.paymentMethod,
          amount: entity.totals.grandTotal,
          paid_at: entity.paidAt,
        },
        { onConflict: "order_id" },
      );
      if (paymentError) throw new Error(paymentError.message);
    }

    const saved = await this.getById(entity.id);
    if (!saved) throw new Error("บันทึกออเดอร์ไม่สำเร็จ");
    return saved;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client.from("orders").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
}
