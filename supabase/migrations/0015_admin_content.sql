-- KINDO — staff accounts, tracking pixels, editable policy page, extra reviews
--
-- ⚠ AFTER THIS MIGRATION RUNS, ONLY SEEDED ADMINS CAN WRITE.
-- Every admin table's blanket `to authenticated using (true)` policy is
-- replaced with a per-section `has_section(...)` check. The seed below turns
-- every CURRENT auth user into an owner so no existing admin is locked out; a
-- self-registered account gets no admin_profiles row and therefore no access,
-- which closes the public-signup → god-mode hole. Public/anon read policies and
-- the SECURITY DEFINER guest RPCs are untouched — the storefront keeps working.

-- ===========================================================================
-- 1. admin_profiles + section helpers
-- ===========================================================================
create table if not exists admin_profiles (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  email       text,
  is_owner    boolean not null default false,
  sections    text[]  not null default '{}',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table admin_profiles enable row level security;

-- SECURITY DEFINER is required, not a shortcut: these read admin_profiles with
-- the definer's rights, so a policy that calls has_section() does not re-enter
-- admin_profiles' own policies (which would be infinite recursion).
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_profiles where user_id = auth.uid() and active);
$$;

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_profiles where user_id = auth.uid() and active and is_owner);
$$;

create or replace function public.has_section(s text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_profiles
    where user_id = auth.uid() and active and (is_owner or s = any (sections))
  );
$$;

-- admin_profiles policies: a user reads their OWN row (that's how the UI learns
-- its grants); the owner manages everyone.
drop policy if exists "admin_profiles_self_select" on admin_profiles;
create policy "admin_profiles_self_select" on admin_profiles
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "admin_profiles_owner_all" on admin_profiles;
create policy "admin_profiles_owner_all" on admin_profiles
  for all to authenticated using (is_owner()) with check (is_owner());

-- Seed: every existing auth user becomes an owner (retrofit-safe).
insert into admin_profiles (user_id, email, is_owner, sections)
select id, email, true, '{}'
from auth.users
on conflict (user_id) do update set is_owner = true, active = true;

-- ===========================================================================
-- 2. Rewrite admin RLS — section by section
-- ===========================================================================
drop policy if exists "products_admin_all" on products;
create policy "products_admin_write" on products for all to authenticated
  using (has_section('products')) with check (has_section('products'));
-- finance/other read-only consumers can be added later; storefront anon read
-- policy (products_public_select) is untouched.

drop policy if exists "product_images_admin_all" on product_images;
create policy "product_images_admin_write" on product_images for all to authenticated
  using (has_section('products')) with check (has_section('products'));

drop policy if exists "categories_admin_all" on categories;
create policy "categories_admin_write" on categories for all to authenticated
  using (has_section('categories')) with check (has_section('categories'));

drop policy if exists "orders_admin_all" on orders;
create policy "orders_admin_write" on orders for all to authenticated
  using (has_section('orders')) with check (has_section('orders'));

drop policy if exists "order_items_admin_all" on order_items;
create policy "order_items_admin_write" on order_items for all to authenticated
  using (has_section('orders')) with check (has_section('orders'));

drop policy if exists "delivery_prices_admin_all" on delivery_prices;
create policy "delivery_prices_admin_write" on delivery_prices for all to authenticated
  using (has_section('delivery')) with check (has_section('delivery'));

drop policy if exists "client_reviews_admin_all" on client_reviews;
create policy "client_reviews_admin_write" on client_reviews for all to authenticated
  using (has_section('reviews')) with check (has_section('reviews'));

-- Global config is not a grantable section — every admin needs it.
drop policy if exists "store_settings_admin_all" on store_settings;
create policy "store_settings_admin_write" on store_settings for all to authenticated
  using (is_admin()) with check (is_admin());

-- get_admin_order_stats() (0014) checks auth.role() = 'authenticated'. Tighten
-- it to a real admin now that we have the concept.
create or replace function get_admin_order_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_result jsonb;
begin
  if not is_admin() then
    raise exception 'ERR_FORBIDDEN';
  end if;
  select jsonb_build_object(
    'total_orders', (select count(*) from orders),
    'pending_orders', (select count(*) from orders where status = 'pending'),
    'active_products', (select count(*) from products where status = 'active'),
    'revenue', (select coalesce(sum(total), 0) from orders where status <> 'cancelled')
  ) into v_result;
  return v_result;
end;
$$;

-- ===========================================================================
-- 3. tracking_pixels — admin-managed Meta + TikTok pixels, DB-driven
-- ===========================================================================
create table if not exists tracking_pixels (
  id            uuid primary key default gen_random_uuid(),
  provider      text not null default 'meta' check (provider in ('meta', 'tiktok')),
  label         text not null,                 -- "Retargeting hiver", "TikTok — prospection"
  pixel_id      text not null,                 -- Meta: 15-16 digits · TikTok: the pixel code
  active        boolean not null default true,
  scope         text not null default 'all' check (scope in ('all', 'paths')),
  match_values  text[] not null default '{}',  -- pathname prefixes when scope = 'paths'
  events        jsonb not null default
    '{"page_view":true,"view_content":true,"add_to_cart":true,"initiate_checkout":true,"purchase":true}',
  currency      text not null default 'DZD',
  sort_order    integer not null default 0,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table tracking_pixels enable row level security;

create trigger trg_tracking_pixels_updated_at
  before update on tracking_pixels
  for each row execute function update_updated_at();

-- anon reads ACTIVE rows only — a paused campaign's id must not be readable.
drop policy if exists "tracking_pixels_public_select" on tracking_pixels;
create policy "tracking_pixels_public_select" on tracking_pixels
  for select to anon using (active = true);

drop policy if exists "tracking_pixels_auth_select" on tracking_pixels;
create policy "tracking_pixels_auth_select" on tracking_pixels
  for select to authenticated using (true);

drop policy if exists "tracking_pixels_admin_write" on tracking_pixels;
create policy "tracking_pixels_admin_write" on tracking_pixels
  for all to authenticated using (has_section('pixels')) with check (has_section('pixels'));

-- ===========================================================================
-- 4. Editable policy page — overrides pattern (NULL = use the compiled text)
-- ===========================================================================
create table if not exists policy_settings (
  id          boolean primary key default true check (id),
  title_fr    text, title_ar text,
  intro_fr    text, intro_ar text,
  updated_label_fr text, updated_label_ar text,
  updated_at  timestamptz not null default now()
);
insert into policy_settings (id) values (true) on conflict (id) do nothing;
alter table policy_settings enable row level security;

create trigger trg_policy_settings_updated_at
  before update on policy_settings
  for each row execute function update_updated_at();

create table if not exists policy_sections (
  id           uuid primary key default gen_random_uuid(),
  builtin_key  text unique,                 -- 'policy_s1'… = app ships text; NULL = owner-added
  sort_order   integer not null default 0,
  active       boolean not null default true,
  title_fr     text, title_ar text,
  body_fr      text, body_ar text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table policy_sections enable row level security;

create trigger trg_policy_sections_updated_at
  before update on policy_sections
  for each row execute function update_updated_at();

-- Seed identity only — key + order, never the prose (that lives in the app so
-- it stays reviewable in git and keeps receiving translation fixes).
insert into policy_sections (builtin_key, sort_order) values
  ('policy_s1', 0), ('policy_s2', 1), ('policy_s3', 2),
  ('policy_s4', 3), ('policy_s5', 4)
on conflict (builtin_key) do nothing;

-- Both tables world-readable (the page renders to anon); writes gated on policy.
drop policy if exists "policy_settings_public_select" on policy_settings;
create policy "policy_settings_public_select" on policy_settings for select to anon using (true);
drop policy if exists "policy_settings_auth_select" on policy_settings;
create policy "policy_settings_auth_select" on policy_settings for select to authenticated using (true);
drop policy if exists "policy_settings_admin_write" on policy_settings;
create policy "policy_settings_admin_write" on policy_settings for all to authenticated
  using (has_section('policy')) with check (has_section('policy'));

drop policy if exists "policy_sections_public_select" on policy_sections;
create policy "policy_sections_public_select" on policy_sections for select to anon using (true);
drop policy if exists "policy_sections_auth_select" on policy_sections;
create policy "policy_sections_auth_select" on policy_sections for select to authenticated using (true);
drop policy if exists "policy_sections_admin_write" on policy_sections;
create policy "policy_sections_admin_write" on policy_sections for all to authenticated
  using (has_section('policy')) with check (has_section('policy'));

-- ===========================================================================
-- 5. Three more client reviews so the testimonials section has content
-- ===========================================================================
insert into client_reviews (client_name, stars, review_text, image_url, active) values
  ('Yacine B.', 5,
   'Commande livrée en 48h à Oran. Les croquettes sont exactement celles annoncées et mon chien adore. Je recommande KINDO les yeux fermés.',
   null, true),
  ('Lila M.', 5,
   'Très bon service client sur WhatsApp, ils ont répondu à toutes mes questions avant l''achat. Paiement à la livraison, aucun souci. L''arbre à chat est de très bonne qualité.',
   null, true),
  ('Sofiane K.', 4,
   'Bon rapport qualité-prix pour l''aquarium et le matériel. Livraison un jour de retard mais le livreur a prévenu. Je recommanderai.',
   null, true);
