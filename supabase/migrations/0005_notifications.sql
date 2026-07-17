-- Notification log
create type notification_channel as enum ('BROWSER', 'DISCORD_MOCK', 'LINE_MOCK', 'TELEGRAM_MOCK');

create table notification_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  title text not null,
  message text not null,
  channel notification_channel not null default 'BROWSER',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notification_logs_tenant_idx on notification_logs(tenant_id, created_at);
