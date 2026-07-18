import type { ServiceContainer } from "../contracts";
import { SupabaseNotificationService } from "../notification-service";
import { SupabaseRealtimeService } from "../realtime-service";
import { SupabaseAuthService } from "./supabase-auth-service";
import { SupabaseStaffAccessService } from "./supabase-staff-access-service";
import { createBrowserSupabaseClient } from "./supabase-client";
import { SupabaseOrderRepository } from "./supabase-order-repository";
import { SupabaseProductRepository } from "./supabase-product-repository";
import {
  SupabaseBranchRepository,
  SupabaseCategoryRepository,
  SupabaseRestaurantRepository,
  SupabaseSubscriptionRepository,
  SupabaseTableRepository,
} from "./supabase-repositories";
import { SupabaseUserRepository } from "./supabase-user-repository";

export function createSupabaseServices(): ServiceContainer {
  const client = createBrowserSupabaseClient();

  return {
    auth: new SupabaseAuthService(),
    staffAccess: new SupabaseStaffAccessService(),
    products: new SupabaseProductRepository(client),
    orders: new SupabaseOrderRepository(client),
    restaurants: new SupabaseRestaurantRepository(client),
    branches: new SupabaseBranchRepository(client),
    categories: new SupabaseCategoryRepository(client),
    tables: new SupabaseTableRepository(client),
    users: new SupabaseUserRepository(client),
    subscriptions: new SupabaseSubscriptionRepository(client),
    realtime: new SupabaseRealtimeService(),
    notifications: new SupabaseNotificationService(client),
  };
}
