-- KINDO — seed data: categories + delivery prices for all 58 wilayas
-- Product catalogue itself is seeded through the admin UI (Phase 10 of the
-- go-live checklist), not raw SQL, to prove the CRUD forms work.

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
insert into categories (slug, name_fr, name_ar, description_fr, description_ar, sort_order) values
  ('chiens', 'Chiens', 'كلاب', 'Alimentation, accessoires et soins pour chiens', 'أطعمة وإكسسوارات وعناية للكلاب', 0),
  ('chats', 'Chats', 'قطط', 'Alimentation, accessoires et soins pour chats', 'أطعمة وإكسسوارات وعناية للقطط', 1),
  ('oiseaux', 'Oiseaux', 'طيور', 'Cages, graines et accessoires pour oiseaux', 'أقفاص وحبوب وإكسسوارات للطيور', 2),
  ('poissons', 'Poissons', 'أسماك', 'Aquariums, nourriture et accessoires pour poissons', 'أحواض وأطعمة وإكسسوارات للأسماك', 3),
  ('alimentation-soins', 'Alimentation & Soins', 'الأطعمة والعناية', 'Croquettes, compléments et produits de soin', 'أطعمة جافة، مكملات ومنتجات العناية', 4),
  ('accessoires', 'Accessoires', 'إكسسوارات', 'Laisses, jouets, paniers et plus', 'أطواق، ألعاب، أسرة والمزيد', 5);

-- ---------------------------------------------------------------------------
-- delivery_prices — all 58 Algerian wilayas.
-- Default tiers (admin can edit any row from /admin/delivery-prices):
--   Alger (16)                      -> 400 / 300
--   Greater Algiers ring            -> 500 / 350
--   Rest of the north / high-plains -> 600 / 400
--   Far south / low-density         -> 900 / 700
-- ---------------------------------------------------------------------------
insert into delivery_prices (wilaya, home_price, office_price, active) values
  ('Adrar', 900, 700, true),
  ('Chlef', 600, 400, true),
  ('Laghouat', 700, 500, true),
  ('Oum El Bouaghi', 600, 400, true),
  ('Batna', 600, 400, true),
  ('Béjaïa', 500, 350, true),
  ('Biskra', 700, 500, true),
  ('Béchar', 900, 700, true),
  ('Blida', 500, 350, true),
  ('Bouira', 500, 350, true),
  ('Tamanrasset', 900, 700, true),
  ('Tébessa', 700, 500, true),
  ('Tlemcen', 600, 400, true),
  ('Tiaret', 600, 400, true),
  ('Tizi Ouzou', 500, 350, true),
  ('Alger', 400, 300, true),
  ('Djelfa', 700, 500, true),
  ('Jijel', 600, 400, true),
  ('Sétif', 600, 400, true),
  ('Saïda', 600, 400, true),
  ('Skikda', 600, 400, true),
  ('Sidi Bel Abbès', 600, 400, true),
  ('Annaba', 600, 400, true),
  ('Guelma', 600, 400, true),
  ('Constantine', 600, 400, true),
  ('Médéa', 500, 350, true),
  ('Mostaganem', 600, 400, true),
  ('M''Sila', 600, 400, true),
  ('Mascara', 600, 400, true),
  ('Ouargla', 800, 600, true),
  ('Oran', 600, 400, true),
  ('El Bayadh', 900, 700, true),
  ('Illizi', 900, 700, true),
  ('Bordj Bou Arréridj', 600, 400, true),
  ('Boumerdès', 500, 350, true),
  ('El Tarf', 600, 400, true),
  ('Tindouf', 900, 700, true),
  ('Tissemsilt', 600, 400, true),
  ('El Oued', 800, 600, true),
  ('Khenchela', 700, 500, true),
  ('Souk Ahras', 600, 400, true),
  ('Tipaza', 500, 350, true),
  ('Mila', 600, 400, true),
  ('Aïn Defla', 550, 380, true),
  ('Naâma', 800, 600, true),
  ('Aïn Témouchent', 600, 400, true),
  ('Ghardaïa', 800, 600, true),
  ('Relizane', 600, 400, true),
  ('Timimoun', 900, 700, true),
  ('Bordj Badji Mokhtar', 900, 700, true),
  ('Ouled Djellal', 700, 500, true),
  ('Béni Abbès', 900, 700, true),
  ('In Salah', 900, 700, true),
  ('In Guezzam', 900, 700, true),
  ('Touggourt', 800, 600, true),
  ('Djanet', 900, 700, true),
  ('El M''Ghair', 800, 600, true),
  ('El Meniaa', 900, 700, true);
