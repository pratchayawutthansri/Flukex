-- Row Level Security: helper functions, policies, and role-escalation guards.
--
-- Design note: QR Ordering (src/app/order/[restaurantSlug]/table/[tableToken]) is
-- customer-facing and unauthenticated, so it is NOT modeled as anon RLS policies here.
-- Table lookup-by-token and order creation for that flow must go through a Next.js
-- Route Handler / Server Action using the service-role client (which bypasses RLS),
-- with the table token itself acting as the authorization boundary. Do not grant
-- `anon` direct access to tenant-scoped tables.

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

create or replace function is_tenant_member(target_tenant uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(
    select 1 from memberships where user_id = auth.uid() and tenant_id = target_tenant
  )
$$;

create or replace function has_tenant_role(target_tenant uuid, allowed_roles user_role[])
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(
    select 1 from memberships
    where user_id = auth.uid() and tenant_id = target_tenant and role = any(allowed_roles)
  )
$$;

create or replace function is_platform_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select p.is_platform_admin from profiles p where p.id = auth.uid()), false)
$$;

-- Prevent a user from self-elevating to platform admin via a client-side profile update.
create or replace function profiles_guard_admin_flag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;
  new.is_platform_admin := old.is_platform_admin;
  return new;
end;
$$;

create trigger profiles_guard_admin_flag_trigger
  before update on profiles
  for each row execute function profiles_guard_admin_flag();

-- Prevent a MANAGER (or self-insert) from granting/holding the OWNER role.
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

  if target_role = 'OWNER' and not has_tenant_role(target_tenant, array['OWNER']::user_role[]) then
    raise exception 'only an OWNER can manage OWNER memberships';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger memberships_guard_owner_role_trigger
  before insert or update or delete on memberships
  for each row execute function memberships_guard_owner_role();

-- tenants -------------------------------------------------------------
alter table tenants enable row level security;

create policy tenants_select on tenants for select
  using (is_tenant_member(id) or is_platform_admin());

create policy tenants_update on tenants for update
  using (has_tenant_role(id, array['OWNER']::user_role[]));

-- restaurants -----------------------------------------------------------
alter table restaurants enable row level security;

create policy restaurants_select on restaurants for select
  using (is_tenant_member(tenant_id) or is_platform_admin());

create policy restaurants_update on restaurants for update
  using (has_tenant_role(tenant_id, array['OWNER']::user_role[]));

-- branches ----------------------------------------------------------------
alter table branches enable row level security;

create policy branches_select on branches for select
  using (is_tenant_member(tenant_id) or is_platform_admin());

create policy branches_write on branches for insert
  with check (has_tenant_role(tenant_id, array['OWNER']::user_role[]));

create policy branches_update on branches for update
  using (has_tenant_role(tenant_id, array['OWNER']::user_role[]));

create policy branches_delete on branches for delete
  using (has_tenant_role(tenant_id, array['OWNER']::user_role[]));

-- profiles ------------------------------------------------------------------
alter table profiles enable row level security;

create policy profiles_select on profiles for select
  using (id = auth.uid() or is_platform_admin() or exists (
    select 1 from memberships m1
    join memberships m2 on m1.tenant_id = m2.tenant_id
    where m1.user_id = auth.uid() and m2.user_id = profiles.id
  ));

create policy profiles_update_self on profiles for update
  using (id = auth.uid());

-- memberships ---------------------------------------------------------------
alter table memberships enable row level security;

create policy memberships_select on memberships for select
  using (is_tenant_member(tenant_id) or is_platform_admin());

create policy memberships_insert on memberships for insert
  with check (has_tenant_role(tenant_id, array['OWNER', 'MANAGER']::user_role[]));

create policy memberships_update on memberships for update
  using (has_tenant_role(tenant_id, array['OWNER', 'MANAGER']::user_role[]));

create policy memberships_delete on memberships for delete
  using (has_tenant_role(tenant_id, array['OWNER', 'MANAGER']::user_role[]));

-- categories / products / product_modifiers / tables -------------------------
alter table categories enable row level security;

create policy categories_select on categories for select
  using (is_tenant_member(tenant_id) or is_platform_admin());

create policy categories_write on categories for insert
  with check (has_tenant_role(tenant_id, array['OWNER', 'MANAGER']::user_role[]));

create policy categories_update on categories for update
  using (has_tenant_role(tenant_id, array['OWNER', 'MANAGER']::user_role[]));

create policy categories_delete on categories for delete
  using (has_tenant_role(tenant_id, array['OWNER', 'MANAGER']::user_role[]));

alter table products enable row level security;

create policy products_select on products for select
  using (is_tenant_member(tenant_id) or is_platform_admin());

create policy products_write on products for insert
  with check (has_tenant_role(tenant_id, array['OWNER', 'MANAGER']::user_role[]));

create policy products_update on products for update
  using (has_tenant_role(tenant_id, array['OWNER', 'MANAGER']::user_role[]));

create policy products_delete on products for delete
  using (has_tenant_role(tenant_id, array['OWNER', 'MANAGER']::user_role[]));

alter table product_modifiers enable row level security;

create policy product_modifiers_select on product_modifiers for select
  using (exists (
    select 1 from products p
    where p.id = product_modifiers.product_id
      and (is_tenant_member(p.tenant_id) or is_platform_admin())
  ));

create policy product_modifiers_write on product_modifiers for insert
  with check (exists (
    select 1 from products p
    where p.id = product_modifiers.product_id
      and has_tenant_role(p.tenant_id, array['OWNER', 'MANAGER']::user_role[])
  ));

create policy product_modifiers_update on product_modifiers for update
  using (exists (
    select 1 from products p
    where p.id = product_modifiers.product_id
      and has_tenant_role(p.tenant_id, array['OWNER', 'MANAGER']::user_role[])
  ));

create policy product_modifiers_delete on product_modifiers for delete
  using (exists (
    select 1 from products p
    where p.id = product_modifiers.product_id
      and has_tenant_role(p.tenant_id, array['OWNER', 'MANAGER']::user_role[])
  ));

alter table tables enable row level security;

create policy tables_select on tables for select
  using (is_tenant_member(tenant_id) or is_platform_admin());

create policy tables_write on tables for insert
  with check (has_tenant_role(tenant_id, array['OWNER', 'MANAGER']::user_role[]));

create policy tables_update on tables for update
  using (has_tenant_role(tenant_id, array['OWNER', 'MANAGER']::user_role[]));

create policy tables_delete on tables for delete
  using (has_tenant_role(tenant_id, array['OWNER', 'MANAGER']::user_role[]));

-- orders / order_items / order_status_events / payments ----------------------
alter table orders enable row level security;

create policy orders_select on orders for select
  using (is_tenant_member(tenant_id) or is_platform_admin());

create policy orders_insert on orders for insert
  with check (has_tenant_role(tenant_id, array['OWNER', 'MANAGER', 'CASHIER']::user_role[]));

create policy orders_update on orders for update
  using (has_tenant_role(tenant_id, array['OWNER', 'MANAGER', 'CASHIER', 'KITCHEN', 'BAR']::user_role[]));

create policy orders_delete on orders for delete
  using (has_tenant_role(tenant_id, array['OWNER']::user_role[]));

alter table order_items enable row level security;

create policy order_items_select on order_items for select
  using (exists (
    select 1 from orders o
    where o.id = order_items.order_id
      and (is_tenant_member(o.tenant_id) or is_platform_admin())
  ));

create policy order_items_insert on order_items for insert
  with check (exists (
    select 1 from orders o
    where o.id = order_items.order_id
      and has_tenant_role(o.tenant_id, array['OWNER', 'MANAGER', 'CASHIER']::user_role[])
  ));

create policy order_items_update on order_items for update
  using (exists (
    select 1 from orders o
    where o.id = order_items.order_id
      and has_tenant_role(o.tenant_id, array['OWNER', 'MANAGER', 'CASHIER', 'KITCHEN', 'BAR']::user_role[])
  ));

alter table order_status_events enable row level security;

create policy order_status_events_select on order_status_events for select
  using (exists (
    select 1 from orders o
    where o.id = order_status_events.order_id
      and (is_tenant_member(o.tenant_id) or is_platform_admin())
  ));

create policy order_status_events_insert on order_status_events for insert
  with check (exists (
    select 1 from orders o
    where o.id = order_status_events.order_id
      and has_tenant_role(o.tenant_id, array['OWNER', 'MANAGER', 'CASHIER', 'KITCHEN', 'BAR']::user_role[])
  ));

alter table payments enable row level security;

create policy payments_select on payments for select
  using (is_tenant_member(tenant_id) or is_platform_admin());

create policy payments_insert on payments for insert
  with check (has_tenant_role(tenant_id, array['OWNER', 'MANAGER', 'CASHIER']::user_role[]));

create policy payments_update on payments for update
  using (has_tenant_role(tenant_id, array['OWNER', 'MANAGER', 'CASHIER']::user_role[]));

-- subscriptions / usage_counters ---------------------------------------------
alter table subscriptions enable row level security;

create policy subscriptions_select on subscriptions for select
  using (is_tenant_member(tenant_id) or is_platform_admin());

create policy subscriptions_update on subscriptions for update
  using (has_tenant_role(tenant_id, array['OWNER']::user_role[]) or is_platform_admin());

alter table usage_counters enable row level security;

create policy usage_counters_select on usage_counters for select
  using (is_tenant_member(tenant_id) or is_platform_admin());

-- notification_logs -----------------------------------------------------------
alter table notification_logs enable row level security;

create policy notification_logs_select on notification_logs for select
  using (is_tenant_member(tenant_id) or is_platform_admin());

create policy notification_logs_insert on notification_logs for insert
  with check (is_tenant_member(tenant_id));

create policy notification_logs_update on notification_logs for update
  using (is_tenant_member(tenant_id));

-- platform_members / credit_top_up_requests / credit_ledger_entries / platform_security_events
alter table platform_members enable row level security;

create policy platform_members_select on platform_members for select
  using (is_platform_admin() or has_tenant_role(tenant_id, array['OWNER']::user_role[]));

create policy platform_members_update on platform_members for update
  using (is_platform_admin());

alter table credit_top_up_requests enable row level security;

create policy credit_top_up_requests_select on credit_top_up_requests for select
  using (is_platform_admin() or has_tenant_role(tenant_id, array['OWNER']::user_role[]));

create policy credit_top_up_requests_insert on credit_top_up_requests for insert
  with check (is_platform_admin() or has_tenant_role(tenant_id, array['OWNER']::user_role[]));

create policy credit_top_up_requests_update on credit_top_up_requests for update
  using (is_platform_admin());

alter table credit_ledger_entries enable row level security;

create policy credit_ledger_entries_select on credit_ledger_entries for select
  using (is_platform_admin() or has_tenant_role(tenant_id, array['OWNER']::user_role[]));

create policy credit_ledger_entries_insert on credit_ledger_entries for insert
  with check (is_platform_admin());

alter table platform_security_events enable row level security;

create policy platform_security_events_select on platform_security_events for select
  using (is_platform_admin());

create policy platform_security_events_insert on platform_security_events for insert
  with check (is_platform_admin());
