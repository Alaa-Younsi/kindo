-- KINDO — Row Level Security
--
-- IMPORTANT (go-live requirement): the `authenticated` policies below grant
-- full admin access to ANY Supabase Auth session with role `authenticated` —
-- there is no admin-role table. This is only safe if public sign-up is
-- disabled in Authentication -> Settings. See README "Go-live checklist".

alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table store_settings enable row level security;
alter table delivery_prices enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table client_reviews enable row level security;

-- ---------------------------------------------------------------------------
-- categories — public read, admin full access
-- ---------------------------------------------------------------------------
create policy "categories_public_select" on categories
  for select to anon using (true);

create policy "categories_admin_all" on categories
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- products — public read of active only, admin full access
-- ---------------------------------------------------------------------------
create policy "products_public_select" on products
  for select to anon using (status = 'active');

create policy "products_admin_all" on products
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- product_images — public read, admin full access
-- ---------------------------------------------------------------------------
create policy "product_images_public_select" on product_images
  for select to anon using (true);

create policy "product_images_admin_all" on product_images
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- store_settings — public read, admin full access
-- ---------------------------------------------------------------------------
create policy "store_settings_public_select" on store_settings
  for select to anon using (true);

create policy "store_settings_admin_all" on store_settings
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- delivery_prices — public read, admin full access
-- ---------------------------------------------------------------------------
create policy "delivery_prices_public_select" on delivery_prices
  for select to anon using (true);

create policy "delivery_prices_admin_all" on delivery_prices
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- orders / order_items — NO anon select/insert policy.
-- Writes go exclusively through the place_order SECURITY DEFINER RPC
-- (0003_functions.sql). Reads for guests go through get_order_by_number.
-- Admin (authenticated) gets full access.
-- ---------------------------------------------------------------------------
create policy "orders_admin_all" on orders
  for all to authenticated using (true) with check (true);

create policy "order_items_admin_all" on order_items
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- client_reviews — public read of active only, admin full access
-- ---------------------------------------------------------------------------
create policy "client_reviews_public_select" on client_reviews
  for select to anon using (active = true);

create policy "client_reviews_admin_all" on client_reviews
  for all to authenticated using (true) with check (true);
