-- KINDO — core schema
-- Pet products COD store (dogs, cats, birds, fish, small pets)

create extension if not exists "pgcrypto";

create or replace function update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_fr text not null,
  name_ar text not null,
  description_fr text,
  description_ar text,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_fr text not null,
  name_ar text not null,
  description_fr text,
  description_ar text,
  details_fr text[] not null default '{}',
  details_ar text[] not null default '{}',
  price numeric(10, 2) not null check (price >= 0),
  compare_at_price numeric(10, 2) check (compare_at_price is null or compare_at_price >= 0),
  category_id uuid references categories (id) on delete set null,
  stock int not null default 0 check (stock >= 0),
  style_code text,
  colors jsonb not null default '[]',
  sizes jsonb not null default '[]',
  video_url text,
  featured boolean not null default false,
  status text not null default 'draft' check (status in ('active', 'draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_products_category on products (category_id);
create index idx_products_status on products (status);
create index idx_products_featured on products (featured) where featured = true;

create trigger trg_products_updated_at
  before update on products
  for each row execute function update_updated_at();

-- ---------------------------------------------------------------------------
-- product_images
-- ---------------------------------------------------------------------------
create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  url text not null,
  alt text,
  sort_order int not null default 0
);

create index idx_product_images_product on product_images (product_id);

-- ---------------------------------------------------------------------------
-- store_settings (singleton)
-- ---------------------------------------------------------------------------
create table store_settings (
  id int primary key default 1 check (id = 1),
  shipping_fee numeric(10, 2) not null default 500,
  free_ship_threshold numeric(10, 2) null default null,
  updated_at timestamptz not null default now()
);

insert into store_settings (id) values (1);

create trigger trg_store_settings_updated_at
  before update on store_settings
  for each row execute function update_updated_at();

-- ---------------------------------------------------------------------------
-- delivery_prices
-- ---------------------------------------------------------------------------
create table delivery_prices (
  id uuid primary key default gen_random_uuid(),
  wilaya text unique not null,
  home_price numeric(10, 2) not null default 0,
  office_price numeric(10, 2) not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger trg_delivery_prices_updated_at
  before update on delivery_prices
  for each row execute function update_updated_at();

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_name text not null,
  customer_phone text not null,
  wilaya text not null,
  city text not null,
  address text,
  notes text,
  subtotal numeric(10, 2) not null,
  shipping numeric(10, 2) not null,
  total numeric(10, 2) not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  language text not null default 'fr' check (language in ('fr', 'ar')),
  delivery_type text not null default 'home' check (delivery_type in ('home', 'office')),
  created_at timestamptz not null default now()
);

create index idx_orders_phone_created on orders (customer_phone, created_at desc);
create index idx_orders_status on orders (status);
create index idx_orders_created on orders (created_at desc);

-- ---------------------------------------------------------------------------
-- order_items — prices/names snapshotted at purchase time, never re-joined live
-- ---------------------------------------------------------------------------
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  product_id uuid references products (id) on delete set null,
  name_fr text not null,
  name_ar text not null,
  price numeric(10, 2) not null,
  quantity int not null check (quantity > 0),
  color text,
  size text,
  image_url text
);

create index idx_order_items_order on order_items (order_id);

-- ---------------------------------------------------------------------------
-- client_reviews
-- ---------------------------------------------------------------------------
create table client_reviews (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  stars int not null check (stars between 1 and 5),
  review_text text not null,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
