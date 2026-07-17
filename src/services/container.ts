import { createDefaultDemoData } from "@/data/mock-data";
import type { ServiceContainer } from "./contracts";
import { MockAuthService } from "./mock-auth-service";
import {
  MockBranchRepository,
  MockCategoryRepository,
  MockOrderRepository,
  MockProductRepository,
  MockRestaurantRepository,
  MockSubscriptionRepository,
  MockTableRepository,
  MockUserRepository,
} from "./mock-repositories";
import { BrowserNotificationService } from "./notification-service";
import { BrowserRealtimeService } from "./realtime-service";
import { createSupabaseServices } from "./supabase/supabase-container";

const defaults = createDefaultDemoData();

function createMockServices(): ServiceContainer {
  return {
    auth: new MockAuthService(),
    products: new MockProductRepository("products", () => defaults.products),
    orders: new MockOrderRepository("orders", () => defaults.orders),
    restaurants: new MockRestaurantRepository("restaurants", () => defaults.restaurants),
    branches: new MockBranchRepository("branches", () => defaults.branches),
    categories: new MockCategoryRepository("categories", () => defaults.categories),
    tables: new MockTableRepository("tables", () => defaults.tables),
    users: new MockUserRepository("users", () => defaults.users),
    subscriptions: new MockSubscriptionRepository(),
    realtime: new BrowserRealtimeService(),
    notifications: new BrowserNotificationService(),
  };
}

export const dataProvider = process.env.NEXT_PUBLIC_DATA_PROVIDER ?? "mock";

function createServices(): ServiceContainer {
  if (dataProvider === "mock") return createMockServices();
  if (dataProvider === "supabase") return createSupabaseServices();
  throw new Error(`Data provider "${dataProvider}" is not available. Set NEXT_PUBLIC_DATA_PROVIDER to "mock" or "supabase".`);
}

export const services = createServices();
