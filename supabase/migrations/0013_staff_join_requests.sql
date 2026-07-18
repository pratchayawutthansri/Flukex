-- Staff self-registration never creates a tenant and never grants a role.
-- The request is linked only when both restaurant name and an OWNER/MANAGER
-- approver email resolve to exactly one tenant. Approval is server-authorized.

create table staff_join_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  applicant_user_id uuid not null references profiles(id) on delete cascade,
  applicant_name text not null,
  applicant_email text not null,
  restaurant_name text not null,
  approver_email text not null,
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  reviewed_at timestamptz,
  reviewed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (applicant_user_id)
);

create index staff_join_requests_tenant_status_idx
  on staff_join_requests(tenant_id, status, created_at desc);

create trigger staff_join_requests_set_updated_at
  before update on staff_join_requests
  for each row execute function set_updated_at();

alter table staff_join_requests enable row level security;

create policy staff_join_requests_select on staff_join_requests for select
  using (
    applicant_user_id = auth.uid()
    or is_platform_admin()
    or has_tenant_role(tenant_id, array['OWNER', 'MANAGER']::user_role[])
  );

grant select on staff_join_requests to authenticated;
revoke insert, update, delete on staff_join_requests from authenticated, anon;

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  account_type text := upper(coalesce(new.raw_user_meta_data ->> 'account_type', 'OWNER'));
  requested_restaurant text := trim(coalesce(new.raw_user_meta_data ->> 'restaurant_name', ''));
  requested_approver text := lower(trim(coalesce(new.raw_user_meta_data ->> 'approver_email', '')));
  matched_tenants uuid[];
begin
  insert into profiles (id, name, email)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), new.email), new.email)
  on conflict (id) do nothing;

  if account_type = 'STAFF' then
    if length(requested_restaurant) < 2 or requested_approver = '' then
      raise exception 'restaurant name and approver email are required';
    end if;

    select array_agg(distinct m.tenant_id)
      into matched_tenants
    from memberships m
    join profiles approver on approver.id = m.user_id
    join restaurants r on r.tenant_id = m.tenant_id
    where m.role in ('OWNER', 'MANAGER')
      and lower(trim(approver.email)) = requested_approver
      and lower(trim(r.name)) = lower(requested_restaurant);

    if coalesce(cardinality(matched_tenants), 0) <> 1 then
      raise exception 'restaurant and approver do not match exactly one tenant';
    end if;

    insert into staff_join_requests (
      tenant_id,
      applicant_user_id,
      applicant_name,
      applicant_email,
      restaurant_name,
      approver_email
    ) values (
      matched_tenants[1],
      new.id,
      coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), new.email),
      lower(new.email),
      requested_restaurant,
      requested_approver
    );
  end if;

  return new;
end;
$$;

create or replace function approve_staff_join_request(
  p_request_id uuid,
  p_role text,
  p_branch_ids uuid[] default '{}'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row staff_join_requests%rowtype;
  actor_role user_role;
  target_role user_role;
  current_plan plan_id;
  current_user_count integer;
  max_user_count integer;
  now_at timestamptz := now();
begin
  if auth.uid() is null then raise exception 'must be authenticated'; end if;
  if p_role is null or p_role not in ('MANAGER', 'CASHIER', 'KITCHEN', 'BAR') then raise exception 'invalid staff role'; end if;
  target_role := p_role::user_role;

  select * into request_row
  from staff_join_requests
  where id = p_request_id
  for update;
  if not found or request_row.status <> 'PENDING' then raise exception 'pending request not found'; end if;

  select role into actor_role
  from memberships
  where tenant_id = request_row.tenant_id and user_id = auth.uid();
  if actor_role is null or actor_role not in ('OWNER', 'MANAGER') then raise exception 'not allowed'; end if;
  if actor_role = 'MANAGER' and target_role = 'MANAGER' then raise exception 'manager cannot grant manager role'; end if;
  select plan_id into current_plan from subscriptions where tenant_id = request_row.tenant_id;
  select count(*) into current_user_count from memberships where tenant_id = request_row.tenant_id;
  max_user_count := case current_plan
    when 'free' then 3
    when 'starter' then 15
    when 'professional' then 100
    else 0
  end;
  if current_user_count >= max_user_count then raise exception 'subscription user limit reached'; end if;
  if exists (select 1 from memberships where user_id = request_row.applicant_user_id) then
    raise exception 'applicant already belongs to a tenant';
  end if;
  if exists (
    select 1 from unnest(coalesce(p_branch_ids, '{}'::uuid[])) branch_id
    where not exists (
      select 1 from branches b where b.id = branch_id and b.tenant_id = request_row.tenant_id
    )
  ) then
    raise exception 'invalid branch assignment';
  end if;

  insert into memberships (tenant_id, user_id, role, branch_ids)
  values (request_row.tenant_id, request_row.applicant_user_id, target_role, coalesce(p_branch_ids, '{}'::uuid[]));

  update staff_join_requests
  set status = 'APPROVED', reviewed_at = now_at,
      reviewed_by = (select email from profiles where id = auth.uid())
  where id = request_row.id;

  return jsonb_build_object(
    'id', request_row.applicant_user_id,
    'tenantId', request_row.tenant_id,
    'name', request_row.applicant_name,
    'email', request_row.applicant_email,
    'role', target_role,
    'branchIds', coalesce(p_branch_ids, '{}'::uuid[]),
    'createdAt', request_row.created_at,
    'updatedAt', now_at
  );
end;
$$;

create or replace function reject_staff_join_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row staff_join_requests%rowtype;
  actor_role user_role;
begin
  if auth.uid() is null then raise exception 'must be authenticated'; end if;
  select * into request_row from staff_join_requests where id = p_request_id for update;
  if not found or request_row.status <> 'PENDING' then raise exception 'pending request not found'; end if;
  select role into actor_role from memberships
  where tenant_id = request_row.tenant_id and user_id = auth.uid();
  if actor_role is null or actor_role not in ('OWNER', 'MANAGER') then raise exception 'not allowed'; end if;

  update staff_join_requests
  set status = 'REJECTED', reviewed_at = now(),
      reviewed_by = (select email from profiles where id = auth.uid())
  where id = request_row.id;
end;
$$;

revoke all on function approve_staff_join_request(uuid, text, uuid[]) from public;
revoke all on function reject_staff_join_request(uuid) from public;
grant execute on function approve_staff_join_request(uuid, text, uuid[]) to authenticated;
grant execute on function reject_staff_join_request(uuid) to authenticated;
