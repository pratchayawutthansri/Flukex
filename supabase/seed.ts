// Recreates the mock demo snapshot (tenant_sawasdee_bistro) in a real Supabase project.
// Reuses src/data/mock-data.ts as the single source of truth for the demo story so this
// script can't drift from what the mock provider seeds into Local Storage.
//
// Usage: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm db:seed
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createDefaultDemoData, DEMO_ACCOUNTS, DEMO_TENANT_ID, PLATFORM_ADMIN_ACCOUNT } from "../src/data/mock-data";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running the seed script.");
}

const client = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const idMap = new Map<string, string>();
function remap(oldId: string): string {
  let next = idMap.get(oldId);
  if (!next) {
    next = randomUUID();
    idMap.set(oldId, next);
  }
  return next;
}

async function insert(table: string, rows: Record<string, unknown> | Record<string, unknown>[]) {
  const { error } = await client.from(table).insert(rows);
  if (error) throw new Error(`insert into ${table} failed: ${error.message}`);
}

async function createAuthUser(account: { email: string; password: string; name: string }) {
  const { data, error } = await client.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    user_metadata: { name: account.name },
  });
  if (error || !data.user) throw new Error(`creating auth user ${account.email} failed: ${error?.message}`);
  return data.user.id;
}

async function main() {
  const demo = createDefaultDemoData();
  const tenantId = remap(DEMO_TENANT_ID);

  console.log("Creating auth users...");
  const authUserIdByEmail = new Map<string, string>();
  for (const account of DEMO_ACCOUNTS) {
    authUserIdByEmail.set(account.email, await createAuthUser(account));
  }

  console.log("Marking platform admin profile...");
  await client
    .from("profiles")
    .update({ is_platform_admin: true })
    .eq("id", authUserIdByEmail.get(PLATFORM_ADMIN_ACCOUNT.email));

  console.log("Seeding tenant + restaurant...");
  await insert("tenants", { id: tenantId, name: demo.restaurants[0].name });
  await insert(
    "restaurants",
    demo.restaurants.map((restaurant) => ({
      id: remap(restaurant.id),
      tenant_id: tenantId,
      name: restaurant.name,
      slug: restaurant.slug,
      phone: restaurant.phone,
      address: restaurant.address,
      tax_id: restaurant.taxId ?? null,
    })),
  );

  console.log("Seeding branches...");
  await insert(
    "branches",
    demo.branches.map((branch) => ({
      id: remap(branch.id),
      tenant_id: tenantId,
      restaurant_id: remap(branch.restaurantId),
      name: branch.name,
      code: branch.code,
      address: branch.address,
      is_active: branch.isActive,
    })),
  );

  console.log("Seeding categories...");
  await insert(
    "categories",
    demo.categories.map((category) => ({
      id: remap(category.id),
      tenant_id: tenantId,
      name: category.name,
      color: category.color,
      sort_order: category.sortOrder,
      is_active: category.isActive,
    })),
  );

  console.log("Seeding products + modifiers...");
  for (const product of demo.products) {
    const productId = remap(product.id);
    await insert("products", {
      id: productId,
      tenant_id: tenantId,
      category_id: remap(product.categoryId),
      name: product.name,
      description: product.description,
      price: product.price,
      image_url: product.imageUrl,
      station: product.station,
      is_available: product.isAvailable,
      is_sold_out: product.isSoldOut,
    });
    if (product.modifiers.length > 0) {
      await insert(
        "product_modifiers",
        product.modifiers.map((modifier) => ({
          id: remap(modifier.id),
          product_id: productId,
          name: modifier.name,
          price: modifier.price,
        })),
      );
    }
  }

  console.log("Seeding tables...");
  await insert(
    "tables",
    demo.tables.map((table) => ({
      id: remap(table.id),
      tenant_id: tenantId,
      branch_id: remap(table.branchId),
      name: table.name,
      token: table.token,
      seats: table.seats,
      status: table.status,
    })),
  );

  console.log("Seeding memberships...");
  for (const user of demo.users) {
    const authUserId = authUserIdByEmail.get(user.email);
    if (!authUserId) continue;
    await insert("memberships", {
      tenant_id: tenantId,
      user_id: authUserId,
      role: user.role,
      branch_ids: user.branchIds.map((id) => remap(id)),
    });
  }

  console.log("Seeding subscription + usage counters...");
  await insert("subscriptions", { tenant_id: tenantId, plan_id: "starter" });
  await insert("usage_counters", {
    tenant_id: tenantId,
    branches: demo.branches.filter((branch) => branch.isActive).length,
    users: demo.users.length,
    tables: demo.tables.length,
    products: demo.products.length,
    monthly_orders: demo.orders.length,
  });

  console.log("Seeding orders...");
  for (const order of demo.orders) {
    const orderId = remap(order.id);
    await insert("orders", {
      id: orderId,
      tenant_id: tenantId,
      branch_id: remap(order.branchId),
      table_id: remap(order.tableId),
      table_name: order.tableName,
      order_number: order.orderNumber,
      source: order.source,
      status: order.status,
      subtotal: order.totals.subtotal,
      discount: order.totals.discount,
      service_charge: order.totals.serviceCharge,
      vat: order.totals.vat,
      grand_total: order.totals.grandTotal,
      payment_method: order.paymentMethod ?? null,
      paid_at: order.paidAt ?? null,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
    });

    await insert(
      "order_items",
      order.items.map((item) => ({
        id: remap(item.id),
        order_id: orderId,
        product_id: remap(item.productId),
        product_name: item.productName,
        station: item.station,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        modifiers: item.modifiers,
        note: item.note ?? null,
        status: item.status,
      })),
    );

    await insert("order_status_events", { order_id: orderId, status: order.status });

    if (order.paymentMethod && order.paidAt) {
      await insert("payments", {
        order_id: orderId,
        tenant_id: tenantId,
        method: order.paymentMethod,
        amount: order.totals.grandTotal,
        paid_at: order.paidAt,
      });
    }
  }

  console.log("Seeding notification logs...");
  await insert(
    "notification_logs",
    demo.notifications.map((notification) => ({
      id: remap(notification.id),
      tenant_id: tenantId,
      title: notification.title,
      message: notification.message,
      channel: notification.channel,
      read: notification.read,
      created_at: notification.createdAt,
    })),
  );

  console.log("\nDone. Demo login credentials:");
  for (const account of DEMO_ACCOUNTS) console.log(`  ${account.role}: ${account.email} / ${account.password}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
