-- Algeria's territorial reorganization (Law 26-06, April 2026) split 11 new
-- wilayas out of existing ones, bringing the total from 58 to 69. Seed the
-- new rows into delivery_prices, priced at the same tier as the wilaya each
-- was carved out of (admin can retune any row from /admin/delivery-prices).
insert into delivery_prices (wilaya, home_price, office_price, active) values
  ('Aflou', 700, 500, true),               -- ex-Laghouat
  ('Barika', 600, 400, true),               -- ex-Batna
  ('El Kantara', 700, 500, true),           -- ex-Biskra
  ('Bir El Ater', 700, 500, true),          -- ex-Tébessa
  ('El Aricha', 600, 400, true),            -- ex-Tlemcen
  ('Ksar Chellala', 600, 400, true),        -- ex-Tiaret
  ('Aïn Oussera', 700, 500, true),          -- ex-Djelfa
  ('Messaad', 700, 500, true),              -- ex-Djelfa
  ('Ksar El Boukhari', 500, 350, true),     -- ex-Médéa
  ('Bou Saâda', 600, 400, true),            -- ex-M'Sila
  ('El Abiodh Sidi Cheikh', 900, 700, true); -- ex-El Bayadh
