-- KINDO — order placement & lookup RPCs
--
-- place_order is the single most important function in this schema:
-- it is the ONLY way anon can write to orders/order_items, and it never
-- trusts client-sent prices, stock, or shipping — everything is
-- re-derived server-side from the current DB state.

create or replace function generate_order_number()
returns text
language plpgsql
as $$
declare
  v_suffix text;
begin
  v_suffix := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 5));
  return 'KDO-' || to_char(now(), 'YYYYMMDD') || '-' || v_suffix;
end;
$$;

create or replace function place_order(items jsonb, customer jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_phone text;
  v_wilaya text;
  v_city text;
  v_address text;
  v_notes text;
  v_delivery_type text;
  v_language text;

  v_item jsonb;
  v_product_id uuid;
  v_qty int;
  v_color text;
  v_size text;
  v_item_count int;

  v_product products%rowtype;
  v_subtotal numeric(10, 2) := 0;
  v_shipping numeric(10, 2) := 0;
  v_total numeric(10, 2) := 0;

  v_delivery delivery_prices%rowtype;
  v_settings store_settings%rowtype;

  v_order_id uuid;
  v_order_number text;

  v_recent_10min int;
  v_recent_24h int;
begin
  -- ---------------------------------------------------------------------
  -- 0. Validate customer input server-side (browser zod/honeypot are UX
  --    only — the anon key ships in the JS bundle, so a direct RPC call
  --    skips both).
  -- ---------------------------------------------------------------------
  v_name := btrim(coalesce(customer ->> 'name', ''));
  v_phone := btrim(coalesce(customer ->> 'phone', ''));
  v_wilaya := btrim(coalesce(customer ->> 'wilaya', ''));
  v_city := btrim(coalesce(customer ->> 'city', ''));
  v_address := nullif(btrim(coalesce(customer ->> 'address', '')), '');
  v_notes := nullif(btrim(coalesce(customer ->> 'notes', '')), '');
  v_delivery_type := btrim(coalesce(customer ->> 'delivery_type', ''));
  v_language := btrim(coalesce(customer ->> 'language', ''));

  if char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception 'ERR_INVALID_INPUT: name';
  end if;

  if v_phone !~ '^0[5-7][0-9]{8}$' then
    raise exception 'ERR_INVALID_INPUT: phone';
  end if;

  if char_length(v_city) < 1 or char_length(v_city) > 80 then
    raise exception 'ERR_INVALID_INPUT: city';
  end if;

  if v_delivery_type not in ('home', 'office') then
    raise exception 'ERR_INVALID_INPUT: delivery_type';
  end if;

  if v_language not in ('fr', 'ar') then
    v_language := 'fr';
  end if;

  if v_address is not null then
    v_address := left(v_address, 200);
  end if;
  if v_notes is not null then
    v_notes := left(v_notes, 500);
  end if;

  -- ---------------------------------------------------------------------
  -- 1. Rate-limit by phone number — real defense against a fake-order
  --    flood zeroing stock, since client-side guards do nothing against
  --    direct RPC calls. Cancelled orders still count.
  -- ---------------------------------------------------------------------
  select count(*) into v_recent_10min
  from orders
  where customer_phone = v_phone
    and created_at > now() - interval '10 minutes';

  if v_recent_10min >= 3 then
    raise exception 'ERR_RATE_LIMIT: too many orders in 10 minutes';
  end if;

  select count(*) into v_recent_24h
  from orders
  where customer_phone = v_phone
    and created_at > now() - interval '24 hours';

  if v_recent_24h >= 10 then
    raise exception 'ERR_RATE_LIMIT: too many orders in 24 hours';
  end if;

  -- ---------------------------------------------------------------------
  -- 2. Validate cart shape.
  -- ---------------------------------------------------------------------
  if items is null or jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 then
    raise exception 'ERR_CART_EMPTY: cart is empty';
  end if;

  v_item_count := jsonb_array_length(items);
  if v_item_count > 20 then
    raise exception 'ERR_CART_EMPTY: too many distinct line items';
  end if;

  -- ---------------------------------------------------------------------
  -- 3. Validate + price + stock-check every line, WITHOUT writing yet.
  --    Reject on insufficient stock rather than clamping — clamping would
  --    accept orders that can't be fulfilled under concurrent checkouts.
  -- ---------------------------------------------------------------------
  for v_item in select * from jsonb_array_elements(items)
  loop
    if v_item ->> 'product_id' is null then
      raise exception 'ERR_PRODUCT_UNAVAILABLE: missing product_id';
    end if;

    begin
      v_product_id := (v_item ->> 'product_id')::uuid;
    exception when others then
      raise exception 'ERR_PRODUCT_UNAVAILABLE: invalid product_id';
    end;

    begin
      v_qty := (v_item ->> 'quantity')::int;
    exception when others then
      raise exception 'ERR_PRODUCT_UNAVAILABLE: invalid quantity';
    end;

    if v_qty is null or v_qty <= 0 or v_qty > 20 then
      raise exception 'ERR_PRODUCT_UNAVAILABLE: invalid quantity';
    end if;

    select * into v_product from products where id = v_product_id and status = 'active';
    if not found then
      raise exception 'ERR_PRODUCT_UNAVAILABLE: product % not available', v_product_id;
    end if;

    if v_product.stock < v_qty then
      raise exception 'ERR_STOCK: insufficient stock for %', v_product.name_fr;
    end if;

    v_subtotal := v_subtotal + (v_product.price * v_qty);
  end loop;

  -- ---------------------------------------------------------------------
  -- 4. Resolve shipping from delivery_prices + store_settings — never
  --    trust a client-sent shipping amount, and never silently price an
  --    unknown wilaya at the generic fallback fee.
  -- ---------------------------------------------------------------------
  select * into v_delivery from delivery_prices where wilaya = v_wilaya;
  if not found then
    raise exception 'ERR_INVALID_INPUT: wilaya';
  end if;
  if not v_delivery.active then
    raise exception 'ERR_WILAYA_DISABLED: %', v_wilaya;
  end if;

  select * into v_settings from store_settings where id = 1;

  v_shipping := case when v_delivery_type = 'home' then v_delivery.home_price else v_delivery.office_price end;

  if v_settings.free_ship_threshold is not null and v_subtotal >= v_settings.free_ship_threshold then
    v_shipping := 0;
  end if;

  v_total := v_subtotal + v_shipping;

  -- ---------------------------------------------------------------------
  -- 5. Insert order + order_items (snapshotted name/price), then decrement
  --    stock — every item already verified sufficient above.
  -- ---------------------------------------------------------------------
  v_order_number := generate_order_number();

  insert into orders (
    order_number, customer_name, customer_phone, wilaya, city, address, notes,
    subtotal, shipping, total, status, language, delivery_type
  ) values (
    v_order_number, v_name, v_phone, v_wilaya, v_city, v_address, v_notes,
    v_subtotal, v_shipping, v_total, 'pending', v_language, v_delivery_type
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(items)
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_qty := (v_item ->> 'quantity')::int;
    v_color := left(nullif(btrim(coalesce(v_item ->> 'color', '')), ''), 40);
    v_size := left(nullif(btrim(coalesce(v_item ->> 'size', '')), ''), 40);

    select * into v_product from products where id = v_product_id;

    insert into order_items (
      order_id, product_id, name_fr, name_ar, price, quantity, color, size, image_url
    ) values (
      v_order_id, v_product.id, v_product.name_fr, v_product.name_ar, v_product.price, v_qty,
      v_color, v_size,
      (select url from product_images where product_id = v_product.id order by sort_order limit 1)
    );

    update products set stock = stock - v_qty where id = v_product.id;
  end loop;

  return v_order_number;
end;
$$;

revoke all on function place_order(jsonb, jsonb) from public;
grant execute on function place_order(jsonb, jsonb) to anon;

-- ---------------------------------------------------------------------------
-- get_order_by_number — guest-safe single-row lookup.
-- orders has no anon SELECT policy (holds phone/address), so this RPC
-- bypasses RLS deliberately, returning only what OrderConfirmation.tsx
-- needs, and never phone/address/notes.
-- ---------------------------------------------------------------------------
create or replace function get_order_by_number(p_order_number text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_items jsonb;
begin
  select * into v_order from orders where order_number = p_order_number;
  if not found then
    return null;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'name_fr', oi.name_fr,
    'name_ar', oi.name_ar,
    'price', oi.price,
    'quantity', oi.quantity,
    'color', oi.color,
    'size', oi.size,
    'image_url', oi.image_url
  )), '[]'::jsonb) into v_items
  from order_items oi
  where oi.order_id = v_order.id;

  return jsonb_build_object(
    'order_number', v_order.order_number,
    'customer_name', v_order.customer_name,
    'wilaya', v_order.wilaya,
    'city', v_order.city,
    'delivery_type', v_order.delivery_type,
    'subtotal', v_order.subtotal,
    'shipping', v_order.shipping,
    'total', v_order.total,
    'status', v_order.status,
    'language', v_order.language,
    'created_at', v_order.created_at,
    'items', v_items
  );
end;
$$;

revoke all on function get_order_by_number(text) from public;
grant execute on function get_order_by_number(text) to anon;

-- ---------------------------------------------------------------------------
-- Restock on cancellation — place_order decrements stock at placement
-- (correct, it's reserved for that customer). COD refusal rates are high;
-- without this, every refused delivery permanently eats inventory.
-- Fires only on the TRANSITION into 'cancelled' so re-saving an
-- already-cancelled order can't double-credit stock.
-- ---------------------------------------------------------------------------
create or replace function restock_cancelled_order()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    update products p
    set stock = p.stock + oi.quantity
    from order_items oi
    where oi.order_id = new.id
      and oi.product_id = p.id;
  end if;
  return new;
end;
$$;

create trigger trg_restock_cancelled_order
  after update of status on orders
  for each row execute function restock_cancelled_order();
