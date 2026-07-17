-- Fixes a bug in memberships_guard_owner_role (0007_rls.sql): it blocked
-- bootstrap_tenant's own OWNER membership insert for brand-new users, because that
-- RPC runs under the caller's own JWT (auth.role() = 'authenticated', not
-- 'service_role') even though the function itself is SECURITY DEFINER.
--
-- Fix: a tenant's very first-ever membership may be OWNER, created by anyone —
-- there is no other authenticated path to create a tenant (tenants/restaurants have
-- no authenticated INSERT policy), so a tenant with zero memberships was, by
-- construction, just created by bootstrap_tenant for the calling user.
create or replace function memberships_guard_owner_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_tenant uuid;
  target_role user_role;
begin
  if auth.role() = 'service_role' then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    target_tenant := old.tenant_id;
    target_role := old.role;
  else
    target_tenant := new.tenant_id;
    target_role := new.role;
  end if;

  if tg_op = 'INSERT' and target_role = 'OWNER'
     and not exists (select 1 from memberships where tenant_id = target_tenant) then
    return new;
  end if;

  if target_role = 'OWNER' and not has_tenant_role(target_tenant, array['OWNER']::user_role[]) then
    raise exception 'only an OWNER can manage OWNER memberships';
  end if;

  return coalesce(new, old);
end;
$$;
