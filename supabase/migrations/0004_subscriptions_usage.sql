-- Subscriptions and usage tracking
create type plan_id as enum ('free', 'starter', 'professional');

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references tenants(id) on delete cascade,
  plan_id plan_id not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger subscriptions_set_updated_at
  before update on subscriptions
  for each row execute function set_updated_at();

create table usage_counters (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  branches integer not null default 0,
  users integer not null default 0,
  tables integer not null default 0,
  products integer not null default 0,
  monthly_orders integer not null default 0,
  updated_at timestamptz not null default now()
);

create trigger usage_counters_set_updated_at
  before update on usage_counters
  for each row execute function set_updated_at();
