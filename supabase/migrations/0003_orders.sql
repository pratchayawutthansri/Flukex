-- Orders: orders, order_items, order_status_events, payments
create type order_status as enum ('WAITING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED');
create type order_source as enum ('POS', 'QR');
create type payment_method as enum ('CASH', 'QR', 'CARD');

create table orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  table_id uuid not null references tables(id) on delete restrict,
  table_name text not null,
  order_number text not null,
  source order_source not null,
  status order_status not null default 'WAITING',
  subtotal numeric(12, 2) not null default 0,
  discount numeric(12, 2) not null default 0,
  service_charge numeric(12, 2) not null default 0,
  vat numeric(12, 2) not null default 0,
  grand_total numeric(12, 2) not null default 0,
  payment_method payment_method,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, order_number)
);

create index orders_tenant_idx on orders(tenant_id);
create index orders_branch_status_idx on orders(tenant_id, branch_id, status);
create index orders_tenant_created_idx on orders(tenant_id, created_at);

create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- modifiers stored as a jsonb snapshot (price at order time), not a live FK to product_modifiers
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  product_name text not null,
  station station not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  modifiers jsonb not null default '[]',
  note text,
  status order_status not null default 'WAITING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index order_items_order_idx on order_items(order_id);

create trigger order_items_set_updated_at
  before update on order_items
  for each row execute function set_updated_at();

create table order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  status order_status not null,
  changed_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index order_status_events_order_idx on order_status_events(order_id);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  method payment_method not null,
  amount numeric(12, 2) not null check (amount >= 0),
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index payments_tenant_idx on payments(tenant_id);
