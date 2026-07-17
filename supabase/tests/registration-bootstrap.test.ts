// Verifies the `bootstrap_tenant` RPC (supabase/migrations/0008_auth_and_registration.sql)
// that backs the /register flow: a freshly authenticated user with no membership creates
// their own tenant/restaurant/OWNER membership/subscription/usage_counters in one call.
// Needs a real Supabase project, so it's skipped by default.
//
// Usage: SUPABASE_TEST_URL=... SUPABASE_TEST_ANON_KEY=... SUPABASE_TEST_SERVICE_ROLE_KEY=... pnpm vitest run supabase/tests
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.SUPABASE_TEST_URL;
const anonKey = process.env.SUPABASE_TEST_ANON_KEY;
const serviceKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;
const hasLiveProject = Boolean(url && anonKey && serviceKey);

describe.skipIf(!hasLiveProject)("bootstrap_tenant registration RPC", () => {
  let serviceClient: SupabaseClient;
  let userClient: SupabaseClient;
  let userId: string;
  let createdTenantId: string | null = null;
  const email = `bootstrap-${randomUUID()}@example.com`;
  const password = "Test-password-1234";
  const restaurantName = "Bootstrap Test Restaurant";

  beforeAll(async () => {
    serviceClient = createClient(url ?? "", serviceKey ?? "", { auth: { autoRefreshToken: false, persistSession: false } });

    const { data, error } = await serviceClient.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !data.user) throw new Error(error?.message);
    userId = data.user.id;

    userClient = createClient(url ?? "", anonKey ?? "");
    const { error: signInError } = await userClient.auth.signInWithPassword({ email, password });
    if (signInError) throw new Error(signInError.message);
  });

  afterAll(async () => {
    if (createdTenantId) await serviceClient.from("tenants").delete().eq("id", createdTenantId);
    await serviceClient.auth.admin.deleteUser(userId);
  });

  it("creates a profile row automatically via the auth.users trigger", async () => {
    const { data: profile, error } = await serviceClient.from("profiles").select("id, email").eq("id", userId).single();
    expect(error).toBeNull();
    expect(profile?.email).toBe(email);
  });

  it("creates tenant, restaurant, OWNER membership, subscription, and usage_counters", async () => {
    const { data: tenantId, error } = await userClient.rpc("bootstrap_tenant", { p_restaurant_name: restaurantName });
    expect(error).toBeNull();
    expect(typeof tenantId).toBe("string");
    createdTenantId = tenantId as string;

    const { data: tenant } = await serviceClient.from("tenants").select("id, name").eq("id", createdTenantId).single();
    expect(tenant?.name).toBe(restaurantName);

    const { data: restaurant } = await serviceClient
      .from("restaurants")
      .select("id, name, slug")
      .eq("tenant_id", createdTenantId)
      .single();
    expect(restaurant?.name).toBe(restaurantName);
    expect(restaurant?.slug).toBeTruthy();

    const { data: membership } = await serviceClient
      .from("memberships")
      .select("role")
      .eq("tenant_id", createdTenantId)
      .eq("user_id", userId)
      .single();
    expect(membership?.role).toBe("OWNER");

    const { data: subscription } = await serviceClient
      .from("subscriptions")
      .select("plan_id")
      .eq("tenant_id", createdTenantId)
      .single();
    expect(subscription?.plan_id).toBe("free");

    const { data: usage } = await serviceClient
      .from("usage_counters")
      .select("tenant_id")
      .eq("tenant_id", createdTenantId)
      .maybeSingle();
    expect(usage).not.toBeNull();
  });

  it("refuses a second bootstrap call for a user who already has a membership", async () => {
    const { error } = await userClient.rpc("bootstrap_tenant", { p_restaurant_name: "Second Restaurant" });
    expect(error).not.toBeNull();
  });
});
