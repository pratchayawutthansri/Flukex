// Negative RLS test required by docs/SUPABASE_INTEGRATION.md ("Test cross-tenant
// reads/writes with automated negative tests"). Needs a real Supabase project, so it's
// skipped by default — `pnpm test` (no env vars) stays green without live infra.
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

describe.skipIf(!hasLiveProject)("RLS tenant isolation", () => {
  let serviceClient: SupabaseClient;
  let tenantAId: string;
  let tenantBId: string;
  let userAEmail: string;
  let userAPassword: string;
  let userAId: string;
  let productBId: string;

  beforeAll(async () => {
    serviceClient = createClient(url ?? "", serviceKey ?? "", { auth: { autoRefreshToken: false, persistSession: false } });

    userAEmail = `rls-test-${randomUUID()}@example.com`;
    userAPassword = "Test-password-1234";

    const { data: userA, error: createUserError } = await serviceClient.auth.admin.createUser({
      email: userAEmail,
      password: userAPassword,
      email_confirm: true,
    });
    if (createUserError || !userA.user) throw new Error(createUserError?.message);
    userAId = userA.user.id;

    const { data: tenantA, error: tenantAError } = await serviceClient.from("tenants").insert({ name: "RLS Test Tenant A" }).select("id").single();
    if (tenantAError) throw new Error(tenantAError.message);
    tenantAId = tenantA.id;

    const { data: tenantB, error: tenantBError } = await serviceClient.from("tenants").insert({ name: "RLS Test Tenant B" }).select("id").single();
    if (tenantBError) throw new Error(tenantBError.message);
    tenantBId = tenantB.id;

    const { error: membershipError } = await serviceClient.from("memberships").insert({ tenant_id: tenantAId, user_id: userAId, role: "OWNER" });
    if (membershipError) throw new Error(membershipError.message);

    const { data: categoryB, error: categoryBError } = await serviceClient
      .from("categories")
      .insert({ tenant_id: tenantBId, name: "Tenant B category", color: "#000000", sort_order: 1 })
      .select("id")
      .single();
    if (categoryBError) throw new Error(categoryBError.message);

    const { data: productB, error: productBError } = await serviceClient
      .from("products")
      .insert({ tenant_id: tenantBId, category_id: categoryB.id, name: "Tenant B product", price: 100, station: "KITCHEN" })
      .select("id")
      .single();
    if (productBError) throw new Error(productBError.message);
    productBId = productB.id;
  });

  afterAll(async () => {
    await serviceClient.auth.admin.deleteUser(userAId);
    await serviceClient.from("tenants").delete().in("id", [tenantAId, tenantBId]);
  });

  it("does not let a tenant A user read tenant B's rows", async () => {
    const anonClient = createClient(url ?? "", anonKey ?? "");
    const { error: signInError } = await anonClient.auth.signInWithPassword({ email: userAEmail, password: userAPassword });
    expect(signInError).toBeNull();

    const { data, error } = await anonClient.from("products").select("*").eq("id", productBId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("does not let a tenant A user insert into tenant B", async () => {
    const anonClient = createClient(url ?? "", anonKey ?? "");
    await anonClient.auth.signInWithPassword({ email: userAEmail, password: userAPassword });

    const { error } = await anonClient
      .from("categories")
      .insert({ tenant_id: tenantBId, name: "Should be blocked", color: "#000000", sort_order: 1 });
    expect(error).not.toBeNull();
  });
});
