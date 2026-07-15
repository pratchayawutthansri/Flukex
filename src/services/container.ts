import { createDefaultDemoData } from "@/data/mock-data";
import type { ServiceContainer } from "./contracts";
import { MockAuthService } from "./mock-auth-service";
import { MockOrderRepository, MockProductRepository, MockRestaurantRepository, MockSubscriptionRepository } from "./mock-repositories";
import { BrowserNotificationService } from "./notification-service";
import { BrowserRealtimeService } from "./realtime-service";

const defaults = createDefaultDemoData();

function createMockServices(): ServiceContainer {
  return {
    auth: new MockAuthService(),
    products: new MockProductRepository("products", () => defaults.products),
    orders: new MockOrderRepository("orders", () => defaults.orders),
    restaurants: new MockRestaurantRepository("restaurants", () => defaults.restaurants),
    subscriptions: new MockSubscriptionRepository(),
    realtime: new BrowserRealtimeService(),
    notifications: new BrowserNotificationService(),
  };
}

const provider = process.env.NEXT_PUBLIC_DATA_PROVIDER ?? "mock";

if (provider !== "mock") {
  throw new Error(`Data provider "${provider}" is not available in this demo. Set NEXT_PUBLIC_DATA_PROVIDER=mock.`);
}

export const services = createMockServices();
