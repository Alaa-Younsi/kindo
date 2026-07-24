-- Real subcategory data for the 4 animal categories, mirroring the
-- 2-level "group -> item" structure (e.g. Chiens > Alimentaire > Croquettes)
-- used by comparable DZ pet-store sites. Each group and item is just a
-- category row with parent_id set — no special modeling needed.
do $$
declare
  v_chiens uuid;
  v_chats uuid;
  v_oiseaux uuid;
  v_poissons uuid;
  v_group uuid;
begin
  select id into v_chiens from categories where slug = 'chiens';
  select id into v_chats from categories where slug = 'chats';
  select id into v_oiseaux from categories where slug = 'oiseaux';
  select id into v_poissons from categories where slug = 'poissons';

  -- ===================== Chiens =====================
  insert into categories (slug, name_fr, name_ar, parent_id, sort_order)
  values ('chiens-alimentaire', 'Alimentaire', 'الأطعمة', v_chiens, 0)
  returning id into v_group;
  insert into categories (slug, name_fr, name_ar, parent_id, sort_order) values
    ('chiens-croquettes', 'Croquettes', 'كروكيت', v_group, 0),
    ('chiens-conserves', 'Conserves', 'معلبات', v_group, 1),
    ('chiens-gelees', 'Gelées', 'هلام', v_group, 2),
    ('chiens-friandises', 'Friandises', 'حلويات', v_group, 3);

  insert into categories (slug, name_fr, name_ar, parent_id, sort_order)
  values ('chiens-accessoires', 'Accessoires', 'إكسسوارات', v_chiens, 1)
  returning id into v_group;
  insert into categories (slug, name_fr, name_ar, parent_id, sort_order) values
    ('chiens-dressage', 'Dressage', 'تدريب', v_group, 0),
    ('chiens-distributeur-gamelle', 'Distributeur et gamelle', 'موزع وأواني الطعام', v_group, 1),
    ('chiens-harnais-collier', 'Harnais et collier', 'سير وطوق', v_group, 2),
    ('chiens-jeux-jouets', 'Jeux et Jouets', 'ألعاب', v_group, 3),
    ('chiens-litieres-bac', 'Litières et Bac à litière', 'فرشة وصندوق الفضلات', v_group, 4),
    ('chiens-cage-transport', 'Cage de transport', 'قفص نقل', v_group, 5),
    ('chiens-vetements', 'Vêtements', 'ملابس', v_group, 6);

  insert into categories (slug, name_fr, name_ar, parent_id, sort_order)
  values ('chiens-soin-toilettage', 'Soin et Toilettage', 'العناية والتجميل', v_chiens, 2)
  returning id into v_group;
  insert into categories (slug, name_fr, name_ar, parent_id, sort_order) values
    ('chiens-brosses-soins', 'Brosses et soins', 'فرشاة وعناية', v_group, 0),
    ('chiens-eau-cologne', 'Eau de cologne', 'كولونيا', v_group, 1),
    ('chiens-shampoings', 'Shampoings', 'شامبو', v_group, 2);

  -- ===================== Chats =====================
  insert into categories (slug, name_fr, name_ar, parent_id, sort_order)
  values ('chats-alimentaire', 'Alimentaire', 'الأطعمة', v_chats, 0)
  returning id into v_group;
  insert into categories (slug, name_fr, name_ar, parent_id, sort_order) values
    ('chats-croquettes', 'Croquettes', 'كروكيت', v_group, 0),
    ('chats-conserves', 'Conserves', 'معلبات', v_group, 1),
    ('chats-gelees', 'Gelées', 'هلام', v_group, 2),
    ('chats-friandises', 'Friandises', 'حلويات', v_group, 3);

  insert into categories (slug, name_fr, name_ar, parent_id, sort_order)
  values ('chats-accessoires', 'Accessoires', 'إكسسوارات', v_chats, 1)
  returning id into v_group;
  insert into categories (slug, name_fr, name_ar, parent_id, sort_order) values
    ('chats-griffoir-arbre', 'Griffoir et Arbre à chat', 'خدّاشة وشجرة قطط', v_group, 0),
    ('chats-litiere-bac', 'Litière et Bac à litière', 'فرشة وصندوق الفضلات', v_group, 1),
    ('chats-jeux-jouets', 'Jeux et Jouets', 'ألعاب', v_group, 2),
    ('chats-cage-transport', 'Cage de transport', 'قفص نقل', v_group, 3),
    ('chats-collier-laisse', 'Collier et laisse', 'طوق وسير', v_group, 4),
    ('chats-vetements', 'Vêtements', 'ملابس', v_group, 5);

  insert into categories (slug, name_fr, name_ar, parent_id, sort_order)
  values ('chats-soin-toilettage', 'Soin et Toilettage', 'العناية والتجميل', v_chats, 2)
  returning id into v_group;
  insert into categories (slug, name_fr, name_ar, parent_id, sort_order) values
    ('chats-brosses-soins', 'Brosses et soins', 'فرشاة وعناية', v_group, 0),
    ('chats-shampoings', 'Shampoings', 'شامبو', v_group, 1),
    ('chats-anti-puces', 'Anti-puces', 'مضاد للبراغيث', v_group, 2);

  -- ===================== Oiseaux =====================
  insert into categories (slug, name_fr, name_ar, parent_id, sort_order)
  values ('oiseaux-alimentaire', 'Alimentaire', 'الأطعمة', v_oiseaux, 0)
  returning id into v_group;
  insert into categories (slug, name_fr, name_ar, parent_id, sort_order) values
    ('oiseaux-graines', 'Graines', 'حبوب', v_group, 0),
    ('oiseaux-friandises', 'Friandises', 'حلويات', v_group, 1),
    ('oiseaux-complements', 'Compléments alimentaires', 'مكملات غذائية', v_group, 2);

  insert into categories (slug, name_fr, name_ar, parent_id, sort_order)
  values ('oiseaux-accessoires', 'Accessoires', 'إكسسوارات', v_oiseaux, 1)
  returning id into v_group;
  insert into categories (slug, name_fr, name_ar, parent_id, sort_order) values
    ('oiseaux-cages-volieres', 'Cages et Volières', 'أقفاص وأقفاص كبيرة', v_group, 0),
    ('oiseaux-perchoirs-jouets', 'Perchoirs et jouets', 'مجاثم وألعاب', v_group, 1),
    ('oiseaux-mangeoires-abreuvoirs', 'Mangeoires et abreuvoirs', 'معالف ومساقي', v_group, 2),
    ('oiseaux-nichoirs', 'Nichoirs', 'أعشاش', v_group, 3);

  insert into categories (slug, name_fr, name_ar, parent_id, sort_order)
  values ('oiseaux-soin-toilettage', 'Soin et Toilettage', 'العناية والتجميل', v_oiseaux, 2)
  returning id into v_group;
  insert into categories (slug, name_fr, name_ar, parent_id, sort_order) values
    ('oiseaux-hygiene', 'Produits d''hygiène', 'منتجات النظافة', v_group, 0),
    ('oiseaux-vitamines', 'Vitamines', 'فيتامينات', v_group, 1);

  -- ===================== Poissons =====================
  insert into categories (slug, name_fr, name_ar, parent_id, sort_order)
  values ('poissons-alimentaire', 'Alimentaire', 'الأطعمة', v_poissons, 0)
  returning id into v_group;
  insert into categories (slug, name_fr, name_ar, parent_id, sort_order) values
    ('poissons-flocons', 'Flocons', 'رقائق', v_group, 0),
    ('poissons-granules', 'Granulés', 'حبيبات', v_group, 1),
    ('poissons-nourriture-congelee', 'Nourriture congelée', 'طعام مجمد', v_group, 2);

  insert into categories (slug, name_fr, name_ar, parent_id, sort_order)
  values ('poissons-accessoires', 'Accessoires', 'إكسسوارات', v_poissons, 1)
  returning id into v_group;
  insert into categories (slug, name_fr, name_ar, parent_id, sort_order) values
    ('poissons-aquariums', 'Aquariums', 'أحواض', v_group, 0),
    ('poissons-filtres-pompes', 'Filtres et pompes', 'فلاتر ومضخات', v_group, 1),
    ('poissons-decoration', 'Décoration d''aquarium', 'ديكور الحوض', v_group, 2),
    ('poissons-chauffage-thermometres', 'Chauffage et thermomètres', 'تدفئة وموازين حرارة', v_group, 3);

  insert into categories (slug, name_fr, name_ar, parent_id, sort_order)
  values ('poissons-soin-toilettage', 'Soin et Toilettage', 'العناية والتجميل', v_poissons, 2)
  returning id into v_group;
  insert into categories (slug, name_fr, name_ar, parent_id, sort_order) values
    ('poissons-traitements-eau', 'Traitements de l''eau', 'معالجات الماء', v_group, 0),
    ('poissons-tests-eau', 'Tests d''eau', 'اختبارات الماء', v_group, 1);
end $$;
