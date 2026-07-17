// Role-based write-permission tests required by docs/SUPABASE_INTEGRATION.md
// ("Add role/branch policies for OWNER, MANAGER, CASHIER, KITCHEN, BAR"). Needs a real
// Supabase project, so it's skipped by default — `pnpm test` (no env vars) stays green.
//
// Usage against a project already migrated with supabase/migrations/*.sql:
//   SUPABASE_TEST_URL=... SUPABASE_TEST_ANON_KEY=... SUPABASE_TEST_SERVICE_ROLE_KEY=... pnpm vitest run supabase/tests
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.SUPABASE_TEST_URL;
const anonKey = process.env.SUPABASE_TEST_ANON_KEY;
const serviceKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;
const hasLiveProject = Boolean(url && anonKey && serviceKey);

interface TestUser {
  email: string;
  password: string;
  id: string;
}

async function signInAs(user: TestUser) {
  const client = createClient(url ?? "", anonKey ?? "");
  const { error } = await client.auth.signInWithPassword({ email: user.email, password: user.password });
  if (error) throw new Error(error.message);
  return client;
}

describe.skipIf(!hasLiveProject)("role-based write permissions", () => {
  let serviceClient: SupabaseClient;
  let tenantId: string;
  let categoryId: string;
  let productId: string;
  const owner: TestUser = { email: `rp-owner-${randomUUID()}@example.com`, password: "Test-password-1234", id: "" };
  const manager: TestUser = { email: `rp-manager-${randomUUID()}@example.com`, password: "Test-password-1234", id: "" };
  const cashier: TestUser = { email: `rp-cashier-${randomUUID()}@example.com`, password: "Test-password-1234", id: "" };
  const kitchen: TestUser = { email: `rp-kitchen-${randomUUID()}@example.com`, password: "Test-password-1234", id: "" };

  beforeAll(async () => {
    serviceClient = createClient(url ?? "", serviceKey ?? "", { auth: { autoRefreshToken: false, persistSession: false } });

    for (const user of [owner, manager, cashier, kitchen]) {
      const { data, error } = await serviceClient.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      });
      if (error || !data.user) throw new Error(error?.message);
      user.id = data.user.id;
    }

    const { data: tenant, error: tenantError } = await serviceClient
      .from("tenants")
      .insert({ name: "Role Permissions Test Tenant" })
      .select("id")
      .single();
    if (tenantError) throw new Error(tenantError.message);
    tenantId = tenant.id;

    await serviceClient.from("memberships").insert([
      { tenant_id: tenantId, user_id: owner.id, role: "OWNER" },
      { tenant_id: tenantId, user_id: manager.id, role: "MANAGER" },
      { tenant_id: tenantId, user_id: cashier.id, role: "CASHIER" },
      { tenant_id: tenantId, user_id: kitchen.id, role: "KITCHEN" },
    ]);

    const { data: category, error: categoryError } = await serviceClient
      .from("categories")
      .insert({ tenant_id: tenantId, name: "Test category", color: "#000000", sort_order: 1 })
      .select("id")
      .single();
    if (categoryError) throw new Error(categoryError.message);
    categoryId = category.id;

    const { data: product, error: productError } = await serviceClient
      .from("products")
      .insert({ tenant_id: tenantId, category_id: categoryId, name: "Test product", price: 100, station: "KITCHEN" })
      .select("id")
      .single();
    if (productError) throw new Error(productError.message);
    productId = product.id;
  });

  afterAll(async () => {
    for (const user of [owner, manager, cashier, kitchen]) {
      await serviceClient.auth.admin.deleteUser(user.id);
    }
    await serviceClient.from("tenants").delete().eq("id", tenantId);
  });

  it("blocks CASHIER from writing products", async () => {
    // An UPDATE blocked by RLS's USING clause doesn't error — it just matches zero
    // rows (unlike INSERT's WITH CHECK, which does throw). Assert via .select().
    const client = await signInAs(cashier);
    const { data, error } = await client.from("products").update({ price: 999 }).eq("id", productId).select();
    expect(error).toBeNull();
    expect(data).toEqual([]);

    const { data: unchanged } = await serviceClient.from("products").select("price").eq("id", productId).single();
    expect(unchanged?.price).not.toBe(999);
  });

  it("blocks CASHIER from writing categories", async () => {
    const client = await signInAs(cashier);
    const { error } = await client
      .from("categories")
      .insert({ tenant_id: tenantId, name: "Should be blocked", color: "#111111", sort_order: 2 });
    expect(error).not.toBeNull();
  });

  it("blocks KITCHEN from writing products", async () => {
    const client = await signInAs(kitchen);
    const { error } = await client
      .from("products")
      .insert({ tenant_id: tenantId, category_id: categoryId, name: "Should be blocked", price: 50, station: "KITCHEN" });
    expect(error).not.toBeNull();
  });

  it("allows MANAGER to write categories (positive control)", async () => {
    const client = await signInAs(manager);
    const { error } = await client
      .from("categories")
      .insert({ tenant_id: tenantId, name: "Manager-created category", color: "#222222", sort_order: 3 });
    expect(error).toBeNull();
  });

  it("blocks MANAGER from granting the OWNER role to a new membership", async () => {
    const client = await signInAs(manager);
    const rogueUserId = randomUUID();
    const { error } = await client.from("memberships").insert({ tenant_id: tenantId, user_id: rogueUserId, role: "OWNER" });
    expect(error).not.toBeNull();
  });

  it("allows CASHIER to create an order (positive control for POS flow)", async () => {
    const { data: restaurant, error: restaurantError } = await serviceClient
      .from("restaurants")
      .insert({ tenant_id: tenantId, name: "Test Restaurant", slug: `test-${randomUUID()}`, phone: "", address: "" })
      .select("id")
      .single();
    if (restaurantError) throw new Error(restaurantError.message);

    const { data: branch, error: branchError } = await serviceClient
      .from("branches")
      .insert({ tenant_id: tenantId, restaurant_id: restaurant.id, name: "Main", code: "M", address: "" })
      .select("id")
      .single();
    if (branchError) throw new Error(branchError.message);

    const { data: table, error: tableError } = await serviceClient
      .from("tables")
      .insert({ tenant_id: tenantId, branch_id: branch.id, name: "Table 1", token: `token-${randomUUID()}`, seats: 4 })
      .select("id")
      .single();
    if (tableError) throw new Error(tableError.message);

    const client = await signInAs(cashier);
    const { error } = await client.from("orders").insert({
      tenant_id: tenantId,
      branch_id: branch.id,
      table_id: table.id,
      table_name: "Table 1",
      order_number: `#${randomUUID().slice(0, 8)}`,
      source: "POS",
      status: "WAITING",
    });
    expect(error).toBeNull();
  });
});
