import type { SupabaseClient } from "@supabase/supabase-js";
import type { Branch, Category, PlanId, Restaurant, RestaurantTable } from "@/domain/types";
import type { BranchRepository, CategoryRepository, RestaurantRepository, SubscriptionRepository, TableRepository } from "../contracts";
import { SupabaseRepository } from "./base-repository";

export class SupabaseRestaurantRepository extends SupabaseRepository<Restaurant> implements RestaurantRepository {
  constructor(client: SupabaseClient) {
    super(client, "restaurants");
  }

  protected toRow(entity: Restaurant) {
    return {
      id: entity.id,
      tenant_id: entity.tenantId,
      name: entity.name,
      slug: entity.slug,
      phone: entity.phone,
      address: entity.address,
      tax_id: entity.taxId ?? null,
      logo_url: entity.logoUrl ?? null,
    };
  }

  protected fromRow(row: Record<string, unknown>): Restaurant {
    return {
      id: row.id as string,
      tenantId: row.tenant_id as string,
      name: row.name as string,
      slug: row.slug as string,
      phone: row.phone as string,
      address: row.address as string,
      taxId: (row.tax_id as string | null) ?? undefined,
      logoUrl: (row.logo_url as string | null) ?? undefined,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }
}

export class SupabaseBranchRepository extends SupabaseRepository<Branch> implements BranchRepository {
  constructor(client: SupabaseClient) {
    super(client, "branches");
  }

  protected toRow(entity: Branch) {
    return {
      id: entity.id,
      tenant_id: entity.tenantId,
      restaurant_id: entity.restaurantId,
      name: entity.name,
      code: entity.code,
      address: entity.address,
      is_active: entity.isActive,
    };
  }

  protected fromRow(row: Record<string, unknown>): Branch {
    return {
      id: row.id as string,
      tenantId: row.tenant_id as string,
      restaurantId: row.restaurant_id as string,
      name: row.name as string,
      code: row.code as string,
      address: row.address as string,
      isActive: row.is_active as boolean,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }
}

export class SupabaseCategoryRepository extends SupabaseRepository<Category> implements CategoryRepository {
  constructor(client: SupabaseClient) {
    super(client, "categories");
  }

  protected toRow(entity: Category) {
    return {
      id: entity.id,
      tenant_id: entity.tenantId,
      name: entity.name,
      color: entity.color,
      sort_order: entity.sortOrder,
      is_active: entity.isActive,
    };
  }

  protected fromRow(row: Record<string, unknown>): Category {
    return {
      id: row.id as string,
      tenantId: row.tenant_id as string,
      name: row.name as string,
      color: row.color as string,
      sortOrder: row.sort_order as number,
      isActive: row.is_active as boolean,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }
}

export class SupabaseTableRepository extends SupabaseRepository<RestaurantTable> implements TableRepository {
  constructor(client: SupabaseClient) {
    super(client, "tables");
  }

  protected toRow(entity: RestaurantTable) {
    return {
      id: entity.id,
      tenant_id: entity.tenantId,
      branch_id: entity.branchId,
      name: entity.name,
      token: entity.token,
      seats: entity.seats,
      status: entity.status,
    };
  }

  protected fromRow(row: Record<string, unknown>): RestaurantTable {
    return {
      id: row.id as string,
      tenantId: row.tenant_id as string,
      branchId: row.branch_id as string,
      name: row.name as string,
      token: row.token as string,
      seats: row.seats as number,
      status: row.status as RestaurantTable["status"],
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }
}

export class SupabaseSubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getCurrentPlan(): Promise<PlanId> {
    const { data, error } = await this.client.from("subscriptions").select("plan_id").maybeSingle();
    if (error) throw new Error(error.message);
    return (data?.plan_id as PlanId | undefined) ?? "free";
  }

  async selectPlan(planId: PlanId): Promise<void> {
    // No .eq() filter needed: the RLS `subscriptions_update` policy already restricts
    // this UPDATE to the caller's own tenant row.
    const { error } = await this.client.from("subscriptions").update({ plan_id: planId });
    if (error) throw new Error(error.message);
  }
}
