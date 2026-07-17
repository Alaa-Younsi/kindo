-- KINDO — custom variant groups + quantity offers + order discount
--
-- variants: custom variant groups beyond the built-in color/size axes —
--   [{ name_fr, name_ar, values: string[] }]. jsonb, no join table, so the
--   shape stays flexible and the admin form edits it in place.
-- quantity_offers: [{ type:'free', buy, get } | { type:'price', qty, price }]
--   — priced SERVER-SIDE in place_order (best applicable offer per line);
--   src/lib/offers.ts mirrors the same math client-side for optimistic
--   cart/checkout totals only.
-- order_items.variants: the shopper's custom-variant picks, snapshotted the
--   same way as color/size — [{ name_fr, name_ar, value }] — so an order
--   stays readable even after the product's variant groups are edited.
-- orders.discount: server-computed total discount from quantity offers,
--   never client-sent. total = subtotal - discount + shipping.

alter table products
  add column variants jsonb not null default '[]',
  add column quantity_offers jsonb not null default '[]';

alter table order_items
  add column variants jsonb not null default '[]';

alter table orders
  add column discount numeric(10, 2) not null default 0;
