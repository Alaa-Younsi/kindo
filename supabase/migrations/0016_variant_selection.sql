-- KINDO — variant selection is now REQUIRED, and variant option values are
-- snapshotted bilingually.
--
--  1. If a product defines colours, sizes, or custom variant groups, every
--     order line for it must fill each axis — otherwise ERR_MISSING_SELECTION.
--     (The storefront already blocks this; this is the direct-RPC backstop.)
--  2. order_items.variants entries now store value_fr + value_ar (the option
--     is bilingual). Legacy `value` on the input is still accepted so an old
--     cached cart doesn't error.
--
-- Only the place_order body evolves — signature unchanged.

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

  v_variant jsonb;
  v_variants jsonb;
  v_vgroup jsonb;

  v_offer jsonb;
  v_offer_type text;
  v_buy int;
  v_get int;
  v_group int;
  v_free_units int;
  v_bundle_qty int;
  v_bundle_price numeric(10, 2);
  v_line_base numeric(10, 2);
  v_line_best numeric(10, 2);
  v_line_candidate numeric(10, 2);

  v_product products%rowtype;
  v_subtotal numeric(10, 2) := 0;
  v_discount numeric(10, 2) := 0;
  v_shipping numeric(10, 2) := 0;
  v_total numeric(10, 2) := 0;

  v_delivery delivery_prices%rowtype;
  v_settings store_settings%rowtype;

  v_order_id uuid;
  v_order_number text;

  v_recent_10min int;
  v_recent_24h int;
  v_recent_global_1min int;
  v_recent_global_1h int;
begin
  -- 0. Validate customer input server-side (browser zod/honeypot are UX only).
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

  -- 1. Rate-limit by phone number.
  select count(*) into v_recent_10min
  from orders
  where customer_phone = v_phone and created_at > now() - interval '10 minutes';
  if v_recent_10min >= 3 then
    raise exception 'ERR_RATE_LIMIT: too many orders in 10 minutes';
  end if;

  select count(*) into v_recent_24h
  from orders
  where customer_phone = v_phone and created_at > now() - interval '24 hours';
  if v_recent_24h >= 10 then
    raise exception 'ERR_RATE_LIMIT: too many orders in 24 hours';
  end if;

  -- 1b. Global circuit breaker.
  select count(*) into v_recent_global_1min
  from orders where created_at > now() - interval '1 minute';
  if v_recent_global_1min >= 20 then
    raise exception 'ERR_RATE_LIMIT: global burst';
  end if;

  select count(*) into v_recent_global_1h
  from orders where created_at > now() - interval '1 hour';
  if v_recent_global_1h >= 200 then
    raise exception 'ERR_RATE_LIMIT: global hourly';
  end if;

  -- 2. Validate cart shape.
  if items is null or jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 then
    raise exception 'ERR_CART_EMPTY: cart is empty';
  end if;
  v_item_count := jsonb_array_length(items);
  if v_item_count > 20 then
    raise exception 'ERR_CART_EMPTY: too many distinct line items';
  end if;

  -- 3. Validate + price + stock-check every line, WITHOUT writing yet.
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
    if v_item ? 'variants' and jsonb_typeof(v_item -> 'variants') = 'array'
      and jsonb_array_length(v_item -> 'variants') > 10 then
      raise exception 'ERR_INVALID_INPUT: too many variants';
    end if;

    select * into v_product
    from products
    where id = v_product_id and status = 'active'
    for update;
    if not found then
      raise exception 'ERR_PRODUCT_UNAVAILABLE: product % not available', v_product_id;
    end if;
    if v_product.stock < v_qty then
      raise exception 'ERR_STOCK: insufficient stock for %', v_product.name_fr;
    end if;

    -- Required selections — every axis the product defines must be filled.
    if jsonb_typeof(v_product.colors) = 'array' and jsonb_array_length(v_product.colors) > 0
       and coalesce(nullif(btrim(v_item ->> 'color'), ''), '') = '' then
      raise exception 'ERR_MISSING_SELECTION: colour for %', v_product.name_fr;
    end if;
    if jsonb_typeof(v_product.sizes) = 'array' and jsonb_array_length(v_product.sizes) > 0
       and coalesce(nullif(btrim(v_item ->> 'size'), ''), '') = '' then
      raise exception 'ERR_MISSING_SELECTION: size for %', v_product.name_fr;
    end if;
    if jsonb_typeof(v_product.variants) = 'array' then
      for v_vgroup in select * from jsonb_array_elements(v_product.variants)
      loop
        if not exists (
          select 1
          from jsonb_array_elements(
            case when jsonb_typeof(v_item -> 'variants') = 'array'
                 then v_item -> 'variants' else '[]'::jsonb end
          ) as p(elem)
          where p.elem ->> 'name_fr' = v_vgroup ->> 'name_fr'
            and coalesce(
                  nullif(btrim(p.elem ->> 'value_fr'), ''),
                  nullif(btrim(p.elem ->> 'value'), ''), '') <> ''
        ) then
          raise exception 'ERR_MISSING_SELECTION: variant % for %',
            v_vgroup ->> 'name_fr', v_product.name_fr;
        end if;
      end loop;
    end if;

    -- Best applicable quantity offer for this line (never worse than base).
    v_line_base := v_product.price * v_qty;
    v_line_best := v_line_base;
    if jsonb_typeof(v_product.quantity_offers) = 'array' then
      for v_offer in select * from jsonb_array_elements(v_product.quantity_offers)
      loop
        v_offer_type := v_offer ->> 'type';
        if v_offer_type = 'free' then
          v_buy := coalesce((v_offer ->> 'buy')::int, 0);
          v_get := coalesce((v_offer ->> 'get')::int, 0);
          if v_buy > 0 and v_get > 0 then
            v_group := v_buy + v_get;
            v_free_units := (v_qty / v_group) * v_get;
            v_line_candidate := v_line_base - (v_product.price * v_free_units);
            if v_line_candidate < v_line_best then
              v_line_best := v_line_candidate;
            end if;
          end if;
        elsif v_offer_type = 'price' then
          v_bundle_qty := coalesce((v_offer ->> 'qty')::int, 0);
          v_bundle_price := coalesce((v_offer ->> 'price')::numeric, 0);
          if v_bundle_qty > 0 and v_bundle_price >= 0 then
            v_line_candidate := floor(v_qty::numeric / v_bundle_qty) * v_bundle_price
              + (v_qty % v_bundle_qty) * v_product.price;
            if v_line_candidate < v_line_best then
              v_line_best := v_line_candidate;
            end if;
          end if;
        end if;
      end loop;
    end if;

    v_line_best := greatest(v_line_best, 0);
    v_subtotal := v_subtotal + v_line_base;
    v_discount := v_discount + (v_line_base - v_line_best);
  end loop;

  -- 4. Resolve shipping.
  select * into v_delivery from delivery_prices where wilaya = v_wilaya;
  if not found then
    raise exception 'ERR_INVALID_INPUT: wilaya';
  end if;
  if not v_delivery.active then
    raise exception 'ERR_WILAYA_DISABLED: %', v_wilaya;
  end if;

  select * into v_settings from store_settings where id = 1;
  v_shipping := case when v_delivery_type = 'home' then v_delivery.home_price else v_delivery.office_price end;
  if v_settings.free_ship_threshold is not null
    and (v_subtotal - v_discount) >= v_settings.free_ship_threshold then
    v_shipping := 0;
  end if;
  v_total := v_subtotal - v_discount + v_shipping;

  -- 5. Insert order + items, then decrement stock.
  v_order_number := generate_order_number();

  insert into orders (
    order_number, customer_name, customer_phone, wilaya, city, address, notes,
    subtotal, shipping, discount, total, status, language, delivery_type
  ) values (
    v_order_number, v_name, v_phone, v_wilaya, v_city, v_address, v_notes,
    v_subtotal, v_shipping, v_discount, v_total, 'pending', v_language, v_delivery_type
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(items)
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_qty := (v_item ->> 'quantity')::int;
    v_color := left(nullif(btrim(coalesce(v_item ->> 'color', '')), ''), 40);
    v_size := left(nullif(btrim(coalesce(v_item ->> 'size', '')), ''), 40);

    v_variants := '[]'::jsonb;
    if v_item ? 'variants' and jsonb_typeof(v_item -> 'variants') = 'array' then
      for v_variant in select * from jsonb_array_elements(v_item -> 'variants')
      loop
        v_variants := v_variants || jsonb_build_array(jsonb_build_object(
          'name_fr', left(nullif(btrim(coalesce(v_variant ->> 'name_fr', '')), ''), 40),
          'name_ar', left(nullif(btrim(coalesce(v_variant ->> 'name_ar', '')), ''), 40),
          'value_fr', left(coalesce(nullif(btrim(v_variant ->> 'value_fr'), ''),
                                    nullif(btrim(v_variant ->> 'value'), ''), ''), 40),
          'value_ar', left(coalesce(nullif(btrim(v_variant ->> 'value_ar'), ''),
                                    nullif(btrim(v_variant ->> 'value'), ''), ''), 40)
        ));
      end loop;
    end if;

    select * into v_product from products where id = v_product_id;

    insert into order_items (
      order_id, product_id, name_fr, name_ar, price, quantity, color, size, variants, image_url
    ) values (
      v_order_id, v_product.id, v_product.name_fr, v_product.name_ar, v_product.price, v_qty,
      v_color, v_size, v_variants,
      (select url from product_images where product_id = v_product.id order by sort_order limit 1)
    );

    update products set stock = stock - v_qty where id = v_product.id;
  end loop;

  return v_order_number;
end;
$$;

revoke all on function place_order(jsonb, jsonb) from public;
grant execute on function place_order(jsonb, jsonb) to anon;
