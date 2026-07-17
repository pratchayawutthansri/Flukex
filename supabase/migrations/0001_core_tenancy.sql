-- Core tenancy: tenants, restaurants, branches, profiles, memberships
create extension if not exists pgcrypto;

create type user_role as enum ('OWNER', 'MANAGER', 'CASHIER', 'KITCHEN', 'BAR');

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tenants_set_updated_at
  before update on tenants
  for each row execute function set_updated_at();

create table restaurants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references tenants(id) on delete cascade,
  name text not null,
  slug text not null unique,
  phone text not null,
  address text not null,
  tax_id text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger restaurants_set_updated_at
  before update on restaurants
  for each row execute function set_updated_at();

create table branches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  code text not null,
  address text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index branches_tenant_idx on branches(tenant_id);

create trigger branches_set_updated_at
  before update on branches
  for each row execute function set_updated_at();

-- Mirrors auth.users 1:1; created via handle_new_user trigger (see 0007_rls.sql)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  is_platform_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create table memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role user_role not null,
  branch_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create index memberships_user_idx on memberships(user_id);
create index memberships_tenant_idx on memberships(tenant_id);

create trigger memberships_set_updated_at
  before update on memberships
  for each row execute function set_updated_at();
