import type { SupabaseClient } from "@supabase/supabase-js";
import type { Repository } from "../contracts";

// Row-per-entity mapping for the simple 1:1 tables (Branch, Category, Restaurant, RestaurantTable).
// Product and Order have their own repositories because they join child tables
// (product_modifiers, order_items) that don't fit this generic shape.
export abstract class SupabaseRepository<T extends { id: string }> implements Repository<T> {
  constructor(
    protected readonly client: SupabaseClient,
    protected readonly table: string,
  ) {}

  protected abstract toRow(entity: T): Record<string, unknown>;
  protected abstract fromRow(row: Record<string, unknown>): T;

  async list(): Promise<T[]> {
    const { data, error } = await this.client.from(this.table).select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => this.fromRow(row));
  }

  async getById(id: string): Promise<T | null> {
    const { data, error } = await this.client.from(this.table).select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? this.fromRow(data) : null;
  }

  async save(entity: T): Promise<T> {
    const { data, error } = await this.client.from(this.table).upsert(this.toRow(entity)).select("*").single();
    if (error) throw new Error(error.message);
    return this.fromRow(data);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client.from(this.table).delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
}
