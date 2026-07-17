import type { SupabaseClient } from "@supabase/supabase-js";
import type { Product, ProductModifier } from "@/domain/types";
import type { ProductRepository } from "../contracts";

interface ProductRow {
  id: string;
  tenant_id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  station: Product["station"];
  is_available: boolean;
  is_sold_out: boolean;
  created_at: string;
  updated_at: string;
  product_modifiers: { id: string; name: string; price: number }[] | null;
}

export function productFromRow(row: ProductRow): Product {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description,
    price: row.price,
    imageUrl: row.image_url,
    station: row.station,
    isAvailable: row.is_available,
    isSoldOut: row.is_sold_out,
    modifiers: (row.product_modifiers ?? []).map((modifier): ProductModifier => ({
      id: modifier.id,
      name: modifier.name,
      price: modifier.price,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseProductRepository implements ProductRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(): Promise<Product[]> {
    const { data, error } = await this.client
      .from("products")
      .select("*, product_modifiers(*)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => productFromRow(row as ProductRow));
  }

  async getById(id: string): Promise<Product | null> {
    const { data, error } = await this.client
      .from("products")
      .select("*, product_modifiers(*)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? productFromRow(data as ProductRow) : null;
  }

  async save(entity: Product): Promise<Product> {
    const { error: productError } = await this.client.from("products").upsert({
      id: entity.id,
      tenant_id: entity.tenantId,
      category_id: entity.categoryId,
      name: entity.name,
      description: entity.description,
      price: entity.price,
      image_url: entity.imageUrl,
      station: entity.station,
      is_available: entity.isAvailable,
      is_sold_out: entity.isSoldOut,
    });
    if (productError) throw new Error(productError.message);

    const { error: deleteError } = await this.client.from("product_modifiers").delete().eq("product_id", entity.id);
    if (deleteError) throw new Error(deleteError.message);

    if (entity.modifiers.length > 0) {
      const { error: insertError } = await this.client.from("product_modifiers").insert(
        entity.modifiers.map((modifier) => ({
          id: modifier.id,
          product_id: entity.id,
          name: modifier.name,
          price: modifier.price,
        })),
      );
      if (insertError) throw new Error(insertError.message);
    }

    const saved = await this.getById(entity.id);
    if (!saved) throw new Error("บันทึกสินค้าไม่สำเร็จ");
    return saved;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client.from("products").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
}
