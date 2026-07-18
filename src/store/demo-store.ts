"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { toast } from "sonner";
import { getEntitlements, isWithinLimit } from "@/config/plans";
import { createDefaultDemoData, createNewTenantData, DEMO_TENANT_ID, type DemoData } from "@/data/mock-data";
import { calculateOrderTotals, deriveOrderCalculationOptions } from "@/domain/calculations";
import { isTableTokenAvailable, normalizeTableToken } from "@/domain/qr-ordering";
import type { Branch, Category, DemoUser, NotificationLog, Order, OrderItem, OrderStatus, PlanId, Product, Restaurant, RestaurantTable, TableStatus } from "@/domain/types";
import { createId } from "@/lib/utils";
import { dataProvider, services } from "@/services/container";
import { browserStorage, STORAGE_KEYS } from "@/services/storage";

function reportPersistError(description: string, error: unknown) {
  toast.error(description, { description: error instanceof Error ? error.message : undefined });
}

const DEFAULT_COMMERCE_SETTINGS = { vatRate: 7, serviceChargeRate: 10, pricesIncludeVat: false, receiptFooter: "ขอบคุณที่ใช้บริการ • แล้วพบกันใหม่" };

interface ActivateTenantInput {
  tenantId: string;
  ownerName: string;
  ownerEmail: string;
  restaurantName?: string;
}

interface TenantDataSnapshot extends DemoData {
  planId: PlanId;
  commerceSettings: typeof DEFAULT_COMMERCE_SETTINGS;
}

interface DemoStore extends DemoData {
  activeTenantId: string;
  planId: PlanId;
  commerceSettings: typeof DEFAULT_COMMERCE_SETTINGS;
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  activateTenant: (input: ActivateTenantInput) => void;
  reloadActiveTenant: () => void;
  selectPlan: (planId: PlanId) => void;
  updateCommerceSettings: (settings: Partial<DemoStore["commerceSettings"]>) => void;
  addOrder: (order: Order) => void;
  updateOrderItems: (orderId: string, items: OrderItem[]) => void;
  updateOrderStatus: (orderId: string, itemId: string | null, status: OrderStatus) => void;
  updateTableStatus: (tableId: string, status: TableStatus) => void;
  saveRestaurant: (restaurant: Restaurant) => void;
  saveBranch: (branch: Branch) => void;
  removeBranch: (id: string) => void;
  saveUser: (user: DemoUser) => void;
  removeUser: (id: string) => void;
  saveProduct: (product: Product) => void;
  removeProduct: (id: string) => void;
  saveCategory: (category: Category) => void;
  removeCategory: (id: string) => void;
  saveTable: (table: RestaurantTable) => boolean;
  addNotification: (input: Pick<NotificationLog, "title" | "message" | "channel">) => void;
  markNotificationsRead: () => void;
  resetDemo: () => void;
}

function createDefaultTenantSnapshot(): TenantDataSnapshot {
  return { ...createDefaultDemoData(), planId: "starter", commerceSettings: { ...DEFAULT_COMMERCE_SETTINGS } };
}

function createNewTenantSnapshot(input: ActivateTenantInput): TenantDataSnapshot {
  return {
    ...createNewTenantData({
      tenantId: input.tenantId,
      ownerName: input.ownerName,
      ownerEmail: input.ownerEmail,
      restaurantName: input.restaurantName?.trim() || `ร้านของ ${input.ownerName}`,
    }),
    planId: "free",
    commerceSettings: { ...DEFAULT_COMMERCE_SETTINGS },
  };
}

function selectTenantSnapshot(state: DemoStore): TenantDataSnapshot {
  return {
    users: state.users,
    restaurants: state.restaurants,
    branches: state.branches,
    categories: state.categories,
    products: state.products,
    tables: state.tables,
    orders: state.orders,
    notifications: state.notifications,
    planId: state.planId,
    commerceSettings: state.commerceSettings,
  };
}

function tenantStorageKey(tenantId: string) {
  return `${STORAGE_KEYS.tenantDataPrefix}${tenantId}`;
}

async function fetchSupabaseSnapshot(): Promise<Omit<DemoData, "notifications">> {
  const [restaurants, branches, categories, products, tables, orders, users] = await Promise.all([
    services.restaurants.list(),
    services.branches.list(),
    services.categories.list(),
    services.products.list(),
    services.tables.list(),
    services.orders.list(),
    services.users.list(),
  ]);
  return { restaurants, branches, categories, products, tables, orders, users };
}

async function hydrateFromSupabase(tenantId: string, set: (partial: Partial<DemoStore>) => void) {
  try {
    const [snapshot, planId] = await Promise.all([fetchSupabaseSnapshot(), services.subscriptions.getCurrentPlan()]);
    set({ ...snapshot, planId, activeTenantId: tenantId, hydrated: true });
  } catch (error) {
    reportPersistError("โหลดข้อมูลร้านจาก Supabase ไม่สำเร็จ", error);
    set({ hydrated: true });
  }
}

export const useDemoStore = create<DemoStore>()(
  persist(
    (set, get) => ({
      ...createDefaultDemoData(),
      activeTenantId: DEMO_TENANT_ID,
      planId: "starter",
      commerceSettings: { ...DEFAULT_COMMERCE_SETTINGS },
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      activateTenant: (input) => {
        const current = get();
        if (dataProvider === "supabase") {
          // Always refetch: `hydrated` is also flipped true by zustand-persist's
          // onRehydrateStorage as soon as the (possibly stale/empty) cached
          // snapshot loads from localStorage, so it can't be reused here as a
          // "already loaded from Supabase for this tenant" guard.
          set({ activeTenantId: input.tenantId });
          void hydrateFromSupabase(input.tenantId, set);
          return;
        }

        const currentIsScoped = [...current.users, ...current.restaurants, ...current.branches, ...current.categories, ...current.products, ...current.tables, ...current.orders, ...current.notifications]
          .every((entity) => entity.tenantId === current.activeTenantId);
        if (current.activeTenantId === input.tenantId && currentIsScoped) return;
        if (currentIsScoped) browserStorage.set(tenantStorageKey(current.activeTenantId), selectTenantSnapshot(current));

        const fallback = input.tenantId === DEMO_TENANT_ID ? createDefaultTenantSnapshot() : createNewTenantSnapshot(input);
        const next = browserStorage.get<TenantDataSnapshot>(tenantStorageKey(input.tenantId), fallback);
        browserStorage.set(tenantStorageKey(input.tenantId), next);
        set({ ...next, activeTenantId: input.tenantId });
      },
      reloadActiveTenant: () => {
        const current = get();
        if (dataProvider === "supabase") {
          void hydrateFromSupabase(current.activeTenantId, set);
          return;
        }
        const next = browserStorage.get<TenantDataSnapshot>(tenantStorageKey(current.activeTenantId), selectTenantSnapshot(current));
        set({ ...next });
      },
      selectPlan: (planId) => {
        set({ planId });
        void services.subscriptions.selectPlan(planId);
      },
      updateCommerceSettings: (settings) => set((state) => ({ commerceSettings: { ...state.commerceSettings, ...settings } })),
      addOrder: (order) => {
        const tenantId = get().activeTenantId;
        const scopedOrder = { ...order, tenantId };
        set((state) => ({
          orders: [scopedOrder, ...state.orders],
          tables: state.tables.map((table) => table.id === scopedOrder.tableId ? { ...table, status: "OCCUPIED", updatedAt: scopedOrder.createdAt } : table),
        }));
        if (dataProvider === "supabase") void services.orders.save(scopedOrder).catch((error) => reportPersistError("บันทึกออเดอร์ไม่สำเร็จ", error));
        services.realtime.publish({ type: "ORDER_CREATED", tenantId, payload: scopedOrder, occurredAt: new Date().toISOString() });
      },
      updateOrderItems: (orderId, items) => {
        const state = get();
        const existing = state.orders.find((order) => order.id === orderId);
        const hasInvalidQuantity = items.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1);
        if (
          !existing
          || existing.tenantId !== state.activeTenantId
          || !["WAITING", "PREPARING"].includes(existing.status)
          || items.length === 0
          || hasInvalidQuantity
        ) return;

        const updatedAt = new Date().toISOString();
        const totals = calculateOrderTotals(items, deriveOrderCalculationOptions(existing));
        const updated: Order = {
          ...existing,
          items: items.map((item) => ({ ...item, modifiers: [...item.modifiers] })),
          totals,
          updatedAt,
        };

        set((current) => ({
          orders: current.orders.map((order) => order.id === orderId ? updated : order),
        }));
        if (dataProvider === "supabase") {
          void services.orders.save(updated).catch((error) => reportPersistError("อัปเดตรายการออเดอร์ไม่สำเร็จ", error));
        }
        services.realtime.publish({
          type: "ORDER_UPDATED",
          tenantId: state.activeTenantId,
          payload: updated,
          occurredAt: updatedAt,
        });
      },
      updateOrderStatus: (orderId, itemId, status) => {
        set((state) => ({
          orders: state.orders.map((order) => order.id !== orderId ? order : {
            ...order,
            status: itemId ? order.status : status,
            items: itemId ? order.items.map((item) => item.id === itemId ? { ...item, status } : item) : order.items.map((item) => ({ ...item, status })),
            updatedAt: new Date().toISOString(),
          }),
        }));
        if (dataProvider === "supabase") {
          const updated = get().orders.find((order) => order.id === orderId);
          if (updated) void services.orders.save(updated).catch((error) => reportPersistError("อัปเดตสถานะออเดอร์ไม่สำเร็จ", error));
        }
        services.realtime.publish({ type: "ORDER_UPDATED", tenantId: get().activeTenantId, payload: { orderId, itemId, status }, occurredAt: new Date().toISOString() });
      },
      updateTableStatus: (tableId, status) => {
        set((state) => ({ tables: state.tables.map((table) => table.id === tableId ? { ...table, status, updatedAt: new Date().toISOString() } : table) }));
        if (dataProvider === "supabase") {
          const updated = get().tables.find((table) => table.id === tableId);
          if (updated) void services.tables.save(updated).catch((error) => reportPersistError("อัปเดตสถานะโต๊ะไม่สำเร็จ", error));
        }
        services.realtime.publish({ type: status === "BILL_REQUESTED" ? "BILL_REQUESTED" : "TABLE_UPDATED", tenantId: get().activeTenantId, payload: { tableId, status }, occurredAt: new Date().toISOString() });
      },
      saveRestaurant: (restaurant) => {
        const state = get();
        const scopedRestaurant = { ...restaurant, tenantId: state.activeTenantId };
        set({ restaurants: state.restaurants.map((item) => item.id === scopedRestaurant.id ? scopedRestaurant : item) });
        if (dataProvider === "supabase") void services.restaurants.save(scopedRestaurant).catch((error) => reportPersistError("บันทึกข้อมูลร้านไม่สำเร็จ", error));
      },
      saveBranch: (branch) => {
        const state = get();
        const scopedBranch = { ...branch, tenantId: state.activeTenantId };
        const exists = state.branches.some((item) => item.id === scopedBranch.id);
        const activeUsage = state.branches.filter((item) => item.isActive).length;
        if (!exists && scopedBranch.isActive && !isWithinLimit(state.planId, "maxBranches", activeUsage)) {
          void services.notifications.notify({ title: "ถึงขีดจำกัดสาขาแล้ว", message: "เปลี่ยนแพ็กเกจเพื่อเพิ่มสาขาที่เปิดใช้งาน" });
          return;
        }
        set({ branches: exists ? state.branches.map((item) => item.id === scopedBranch.id ? scopedBranch : item) : [...state.branches, scopedBranch] });
        if (dataProvider === "supabase") void services.branches.save(scopedBranch).catch((error) => reportPersistError("บันทึกสาขาไม่สำเร็จ", error));
      },
      removeBranch: (id) => {
        set((state) => ({ branches: state.branches.filter((branch) => branch.id !== id) }));
        if (dataProvider === "supabase") void services.branches.remove(id).catch((error) => reportPersistError("ลบสาขาไม่สำเร็จ", error));
      },
      saveUser: (user) => {
        const state = get();
        const scopedUser = { ...user, tenantId: state.activeTenantId };
        const exists = state.users.some((item) => item.id === scopedUser.id);
        if (!exists && !isWithinLimit(state.planId, "maxUsers", state.users.length)) {
          void services.notifications.notify({ title: "ถึงขีดจำกัดผู้ใช้แล้ว", message: "เปลี่ยนแพ็กเกจเพื่อเพิ่มบัญชีพนักงาน" });
          return;
        }
        set({ users: exists ? state.users.map((item) => item.id === scopedUser.id ? scopedUser : item) : [...state.users, scopedUser] });
        if (dataProvider === "supabase") void services.users.save(scopedUser).catch((error) => reportPersistError("บันทึกข้อมูลพนักงานไม่สำเร็จ", error));
      },
      removeUser: (id) => {
        set((state) => ({ users: state.users.filter((user) => user.id !== id) }));
        if (dataProvider === "supabase") void services.users.remove(id).catch((error) => reportPersistError("ลบพนักงานไม่สำเร็จ", error));
      },
      saveProduct: (product) => {
        const state = get();
        const scopedProduct = { ...product, tenantId: state.activeTenantId };
        const exists = state.products.some((item) => item.id === scopedProduct.id);
        if (!exists && !isWithinLimit(state.planId, "maxProducts", state.products.length)) {
          void services.notifications.notify({ title: "ถึงขีดจำกัดสินค้าแล้ว", message: "เปลี่ยนแพ็กเกจเพื่อเพิ่มเมนูใหม่" });
          return;
        }
        set({ products: exists ? state.products.map((item) => item.id === scopedProduct.id ? scopedProduct : item) : [scopedProduct, ...state.products] });
        if (dataProvider === "supabase") void services.products.save(scopedProduct).catch((error) => reportPersistError("บันทึกสินค้าไม่สำเร็จ", error));
      },
      removeProduct: (id) => {
        set((state) => ({ products: state.products.filter((product) => product.id !== id) }));
        if (dataProvider === "supabase") void services.products.remove(id).catch((error) => reportPersistError("ลบสินค้าไม่สำเร็จ", error));
      },
      saveCategory: (category) => {
        const state = get();
        const scopedCategory = { ...category, tenantId: state.activeTenantId };
        set({ categories: state.categories.some((item) => item.id === scopedCategory.id) ? state.categories.map((item) => item.id === scopedCategory.id ? scopedCategory : item) : [...state.categories, scopedCategory] });
        if (dataProvider === "supabase") void services.categories.save(scopedCategory).catch((error) => reportPersistError("บันทึกหมวดหมู่ไม่สำเร็จ", error));
      },
      removeCategory: (id) => {
        set((state) => ({ categories: state.categories.filter((category) => category.id !== id) }));
        if (dataProvider === "supabase") void services.categories.remove(id).catch((error) => reportPersistError("ลบหมวดหมู่ไม่สำเร็จ", error));
      },
      saveTable: (table) => {
        const state = get();
        const normalizedToken = normalizeTableToken(table.token);
        const scopedTable = { ...table, tenantId: state.activeTenantId, token: normalizedToken };
        const exists = state.tables.some((item) => item.id === scopedTable.id);
        if (!normalizedToken) {
          toast.error("ไม่พบ QR token ของโต๊ะ", { description: "กรุณาสร้างโต๊ะใหม่เพื่อออก QR Code" });
          return false;
        }
        if (!isTableTokenAvailable(state.tables, normalizedToken, scopedTable.id)) {
          toast.error("QR Code นี้ถูกผูกกับโต๊ะอื่นแล้ว", { description: "แต่ละโต๊ะต้องใช้ QR token ที่ไม่ซ้ำกัน" });
          return false;
        }
        if (!exists && !isWithinLimit(state.planId, "maxTables", state.tables.length)) {
          void services.notifications.notify({ title: "ถึงขีดจำกัดโต๊ะแล้ว", message: "เปลี่ยนแพ็กเกจเพื่อเพิ่มโต๊ะและ QR token" });
          return false;
        }
        set({ tables: exists ? state.tables.map((item) => item.id === scopedTable.id ? scopedTable : item) : [...state.tables, scopedTable] });
        if (dataProvider === "supabase") void services.tables.save(scopedTable).catch((error) => reportPersistError("บันทึกโต๊ะไม่สำเร็จ", error));
        return true;
      },
      addNotification: (input) => set((state) => ({ notifications: [{ id: createId("notification"), tenantId: state.activeTenantId, ...input, createdAt: new Date().toISOString(), read: false }, ...state.notifications].slice(0, 50) })),
      markNotificationsRead: () => set((state) => ({ notifications: state.notifications.map((notification) => ({ ...notification, read: true })) })),
      resetDemo: () => {
        if (dataProvider === "supabase") {
          toast.error("โหมด Supabase จริงไม่รองรับการรีเซ็ตเดโม เพราะจะลบข้อมูลร้านค้าจริง");
          return;
        }
        const state = get();
        const owner = state.users.find((user) => user.role === "OWNER");
        const restaurant = state.restaurants[0];
        const next = state.activeTenantId === DEMO_TENANT_ID
          ? createDefaultTenantSnapshot()
          : createNewTenantSnapshot({
              tenantId: state.activeTenantId,
              ownerName: owner?.name ?? "เจ้าของร้าน",
              ownerEmail: owner?.email ?? "owner@example.com",
              restaurantName: restaurant?.name,
            });
        browserStorage.set(tenantStorageKey(state.activeTenantId), next);
        set({ ...next });
      },
    }),
    {
      name: "flukex-pos:demo-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        users: state.users,
        restaurants: state.restaurants,
        branches: state.branches,
        categories: state.categories,
        products: state.products,
        tables: state.tables,
        orders: state.orders,
        notifications: state.notifications,
        activeTenantId: state.activeTenantId,
        planId: state.planId,
        commerceSettings: state.commerceSettings,
      }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);

if (typeof window !== "undefined" && dataProvider === "mock") {
  useDemoStore.subscribe((state) => {
    browserStorage.set(tenantStorageKey(state.activeTenantId), selectTenantSnapshot(state));
  });
}

export function getCurrentUsage(state: Pick<DemoStore, "branches" | "users" | "tables" | "products" | "orders">) {
  return {
    branches: state.branches.filter((branch) => branch.isActive).length,
    users: state.users.length,
    tables: state.tables.length,
    products: state.products.length,
    monthlyOrders: state.orders.length,
  };
}

export function getUsageWithLimits(state: Pick<DemoStore, "branches" | "users" | "tables" | "products" | "orders" | "planId">) {
  return { usage: getCurrentUsage(state), limits: getEntitlements(state.planId) };
}
