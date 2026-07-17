-- Platform admin: members, credit top-up requests, credit ledger, security events
create type member_status as enum ('PENDING', 'ACTIVE', 'SUSPENDED');
create type credit_request_status as enum ('PENDING', 'APPROVED', 'REJECTED');
create type credit_ledger_type as enum ('TOP_UP', 'USAGE', 'REFUND', 'ADJUSTMENT');

create table platform_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references tenants(id) on delete cascade,
  business_name text not null,
  owner_name text not null,
  owner_email text not null,
  status member_status not null default 'PENDING',
  plan_id plan_id not null default 'free',
  credit_balance numeric(12, 2) not null default 0,
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger platform_members_set_updated_at
  before update on platform_members
  for each row execute function set_updated_at();

create table credit_top_up_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  member_id uuid not null references platform_members(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  requested_by_email text not null,
  amount numeric(12, 2) not null check (amount > 0),
  note text,
  status credit_request_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text,
  review_note text
);

create index credit_top_up_requests_member_idx on credit_top_up_requests(member_id);

create table credit_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references platform_members(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  type credit_ledger_type not null,
  amount numeric(12, 2) not null,
  balance_after numeric(12, 2) not null,
  reference text not null,
  description text not null,
  created_at timestamptz not null default now(),
  created_by text not null
);

create index credit_ledger_entries_member_idx on credit_ledger_entries(member_id, created_at);

create table platform_security_events (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references platform_members(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  type text not null check (type = 'PASSWORD_RESET'),
  created_at timestamptz not null default now(),
  created_by text not null
);

create index platform_security_events_member_idx on platform_security_events(member_id);
