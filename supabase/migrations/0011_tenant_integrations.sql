-- Server-only encrypted integration secrets. No client RLS policy is created:
-- all reads/writes must go through an authenticated API route using service_role.
create table tenant_integrations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  provider text not null check (provider in ('DISCORD')),
  encrypted_secret text not null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, provider)
);

create index tenant_integrations_tenant_idx on tenant_integrations(tenant_id);

alter table tenant_integrations enable row level security;

comment on table tenant_integrations is
  'Encrypted third-party credentials. Accessible only through service-role server routes.';
