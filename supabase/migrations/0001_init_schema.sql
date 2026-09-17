-- Initial schema — see design.md §2 for the reasoning behind each table,
-- and §4 for the RLS rules these policies implement. Do not edit this
-- file once applied; add a new migration instead (see agents.md).

create extension if not exists "uuid-ossp";

-- ─── Tables ──────────────────────────────────────────────────────────────

create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  parent_id uuid references categories(id)
);

create table products (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid not null references categories(id),
  name text not null,
  slug text not null unique,
  description text not null default '',
  base_price numeric not null check (base_price >= 0),
  images text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now()
);

create table product_variants (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  attributes jsonb not null default '{}',
  price_override numeric check (price_override >= 0),
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  sku text not null unique
);

create table promotions (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric not null check (discount_value > 0),
  applies_to text not null check (applies_to in ('all', 'category', 'product')),
  target_id uuid,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  is_active boolean not null default true,
  banner_text text
);

create table orders (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid, -- reserved for v2 accounts; unused in v1
  contact_name text not null,
  contact_phone text not null,
  contact_email text,
  shipping_address jsonb not null,
  total_amount numeric not null check (total_amount >= 0),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed')),
  payment_provider text not null,
  payment_reference text,
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  variant_id uuid not null references product_variants(id),
  quantity int not null check (quantity > 0),
  unit_price numeric not null check (unit_price >= 0)
);

-- ─── Row Level Security ──────────────────────────────────────────────────
-- See design.md §4. Public (anon) role can read published catalog data and
-- create orders; only authenticated admins can write catalog data or read
-- orders back.

alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table promotions enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- categories: public read, admin write
create policy "categories_public_read" on categories
  for select using (true);
create policy "categories_admin_write" on categories
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- products: public read only published, admin full access
create policy "products_public_read_published" on products
  for select using (status = 'published');
create policy "products_admin_all" on products
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- product_variants: public read, admin write
-- (variant visibility follows its parent product's published status)
create policy "variants_public_read" on product_variants
  for select using (
    exists (
      select 1 from products
      where products.id = product_variants.product_id
      and products.status = 'published'
    )
  );
create policy "variants_admin_write" on product_variants
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- promotions: public read (needed to compute displayed prices), admin write
create policy "promotions_public_read" on promotions
  for select using (true);
create policy "promotions_admin_write" on promotions
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- orders: anyone can create (guest checkout); only admins can read/update
create policy "orders_public_insert" on orders
  for insert with check (true);
create policy "orders_admin_read" on orders
  for select using (auth.role() = 'authenticated');
create policy "orders_admin_update" on orders
  for update using (auth.role() = 'authenticated');

-- order_items: same shape as orders
create policy "order_items_public_insert" on order_items
  for insert with check (true);
create policy "order_items_admin_read" on order_items
  for select using (auth.role() = 'authenticated');

-- NOTE: "authenticated" here is a placeholder for "is an admin." If admin
-- and customer accounts ever share the authenticated role (post-v2), these
-- policies must be tightened to check an explicit admin flag/role instead
-- of auth.role() = 'authenticated' alone.
