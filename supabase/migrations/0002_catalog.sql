-- Catalog: categories, products, product_modifiers, tables
create type station as enum ('KITCHEN', 'BAR');
create type table_status as enum ('AVAILABLE', 'OCCUPIED', 'BILL_REQUESTED', 'CLEANING', 'DISABLED');

create table categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  color text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index categories_tenant_idx on categories(tenant_id);

create trigger categories_set_updated_at
  before update on categories
  for each row execute function set_updated_at();

create table products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  category_id uuid not null references categories(id) on delete restrict,
  name text not null,
  description text not null default '',
  price numeric(12, 2) not null check (price >= 0),
  image_url text not null default '',
  station station not null,
  is_available boolean not null default true,
  is_sold_out boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_tenant_idx on products(tenant_id);
create index products_category_idx on products(category_id);

create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

create table product_modifiers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  price numeric(12, 2) not null default 0
);

create index product_modifiers_product_idx on product_modifiers(product_id);

create table tables (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  name text not null,
  token text not null unique,
  seats integer not null check (seats > 0),
  status table_status not null default 'AVAILABLE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tables_tenant_idx on tables(tenant_id);
create index tables_branch_idx on tables(branch_id);

create trigger tables_set_updated_at
  before update on tables
  for each row execute function set_updated_at();
