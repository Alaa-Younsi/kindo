-- KINDO — demo product catalogue (test/preview data only)
-- Fictional listings with placeholder artwork (public/images/seed/*.svg),
-- meant to exercise the storefront + admin CRUD end-to-end before real
-- product photos/copy are entered through /admin. Safe to delete any time
-- from /admin/products once real inventory is ready.

with p as (
  insert into products
    (slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
     price, compare_at_price, category_id, stock, featured, status)
  values
    (
      'croquettes-chien-adulte-volaille-riz',
      'Croquettes Chien Adulte — Volaille & Riz',
      'حبوب للكلاب البالغة - دواجن وأرز',
      'Croquettes complètes pour chien adulte, à base de volaille et riz, pour une digestion facile et un pelage brillant.',
      'حبوب كاملة للكلاب البالغة، أساسها الدواجن والأرز، لهضم سهل وفرو لامع.',
      array['Sac de 5 kg', 'Riche en protéines animales', 'Sans colorants artificiels'],
      array['كيس 5 كغ', 'غني بالبروتينات الحيوانية', 'خالٍ من الألوان الاصطناعية'],
      4200, 4800, (select id from categories where slug = 'chiens'), 34, true, 'active'
    ),
    (
      'laisse-chien-corde-tressee',
      'Laisse Chien — Corde Tressée',
      'مقود كلب - حبل مضفور',
      'Laisse robuste en corde tressée avec poignée rembourrée, idéale pour les balades quotidiennes.',
      'مقود متين من حبل مضفور بمقبض مبطن، مثالي للنزهات اليومية.',
      array['Longueur 1.5 m', 'Mousqueton en acier', 'Poignée rembourrée'],
      array['طول 1.5 م', 'مشبك فولاذي', 'مقبض مبطن'],
      1200, null, (select id from categories where slug = 'chiens'), 52, false, 'active'
    ),
    (
      'panier-chien-moelleux',
      'Panier Chien Moelleux',
      'سرير كلب ناعم',
      'Panier douillet et déhoussable pour un sommeil confortable, disponible en plusieurs tailles.',
      'سرير مريح وقابل لإزالة الغطاء لنوم مريح، متوفر بعدة أحجام.',
      array['Housse lavable en machine', 'Base antidérapante', 'Rembourrage haute densité'],
      array['غطاء قابل للغسل في الغسالة', 'قاعدة مانعة للانزلاق', 'حشوة عالية الكثافة'],
      3800, null, (select id from categories where slug = 'chiens'), 18, false, 'active'
    ),
    (
      'jouet-chien-corde-a-macher',
      'Jouet Chien — Corde à Mâcher',
      'لعبة مضغ للكلاب - حبل',
      'Jouet à mâcher en corde de coton tressé, nettoie les dents en jouant.',
      'لعبة مضغ من حبل قطني مضفور، تنظف الأسنان أثناء اللعب.',
      array['Coton 100% naturel', 'Aide au nettoyage dentaire', 'Résistant à la traction'],
      array['قطن 100% طبيعي', 'يساعد على تنظيف الأسنان', 'مقاوم للشد'],
      650, 900, (select id from categories where slug = 'chiens'), 60, false, 'active'
    ),
    (
      'croquettes-chat-sterilise-saumon',
      'Croquettes Chat Stérilisé — Saumon',
      'حبوب للقطط المعقمة - سلمون',
      'Formule spéciale chat stérilisé au saumon, favorise un poids de forme et une peau saine.',
      'تركيبة خاصة للقطط المعقمة بالسلمون، تساعد على وزن مثالي وبشرة صحية.',
      array['Sac de 2 kg', 'Faible en matières grasses', 'Enrichi en oméga-3'],
      array['كيس 2 كغ', 'قليل الدهون', 'غني بأوميغا-3'],
      3400, null, (select id from categories where slug = 'chats'), 40, true, 'active'
    ),
    (
      'litiere-chat-agglomerante-lavande',
      'Litière Chat Agglomérante — Lavande',
      'رمل قطط متكتل - لافندر',
      'Litière agglomérante à absorption rapide, parfum lavande doux pour un contrôle des odeurs longue durée.',
      'رمل متكتل بامتصاص سريع، برائحة لافندر لطيفة للتحكم في الروائح لفترة طويلة.',
      array['Sac de 10 L', 'Formation de blocs compacts', 'Contrôle des odeurs 7 jours'],
      array['كيس 10 لتر', 'يتكتل بسرعة', 'يتحكم في الروائح لمدة 7 أيام'],
      1100, null, (select id from categories where slug = 'chats'), 45, false, 'active'
    ),
    (
      'arbre-a-chat-3-plateformes',
      'Arbre à Chat — 3 Plateformes',
      'برج للقطط - 3 مستويات',
      'Arbre à chat robuste avec griffoirs en sisal, niches et plateformes d''observation.',
      'برج للقطط متين مزود بأعمدة خدش من السيزال وأعشاش ومنصات للمراقبة.',
      array['Hauteur 120 cm', 'Griffoirs sisal naturel', 'Base lestée anti-bascule'],
      array['ارتفاع 120 سم', 'أعمدة خدش من السيزال الطبيعي', 'قاعدة موزونة مضادة للانقلاب'],
      7500, 8900, (select id from categories where slug = 'chats'), 12, false, 'active'
    ),
    (
      'jouet-chat-plume-interactif',
      'Jouet Chat — Plume Interactive',
      'لعبة قطط - ريشة تفاعلية',
      'Canne à pêche avec plumes pour stimuler l''instinct de chasse de votre chat.',
      'عصا صيد مزودة بريش لتحفيز غريزة الصيد لدى قطتك.',
      array['Tige télescopique', 'Plumes naturelles', 'Grelot intégré'],
      array['عصا قابلة للتطويل', 'ريش طبيعي', 'جرس مدمج'],
      550, null, (select id from categories where slug = 'chats'), 70, false, 'active'
    ),
    (
      'melange-graines-perruches-canaris',
      'Mélange de Graines — Perruches & Canaris',
      'خليط حبوب - ببغاء وكناري',
      'Mélange équilibré de graines pour une alimentation saine des perruches et canaris.',
      'خليط متوازن من الحبوب لتغذية صحية للببغاوات والكناري.',
      array['Sac de 1 kg', 'Mélange de 6 graines', 'Sans poussière'],
      array['كيس 1 كغ', 'خليط من 6 أنواع حبوب', 'خالٍ من الغبار'],
      480, null, (select id from categories where slug = 'oiseaux'), 55, false, 'active'
    ),
    (
      'cage-oiseaux-perchoirs',
      'Cage à Oiseaux avec Perchoirs',
      'قفص طيور مع مجاثم',
      'Cage spacieuse avec plusieurs perchoirs, mangeoires et plateau amovible pour un nettoyage facile.',
      'قفص واسع مزود بعدة مجاثم ومعالف ودرج قابل للسحب لتسهيل التنظيف.',
      array['Dimensions 50x40x60 cm', 'Plateau amovible', '2 mangeoires incluses'],
      array['أبعاد 50×40×60 سم', 'درج قابل للسحب', 'معلفان مرفقان'],
      6200, null, (select id from categories where slug = 'oiseaux'), 15, true, 'active'
    ),
    (
      'os-de-seiche-oiseaux',
      'Os de Seiche',
      'عظم الحبار',
      'Source naturelle de calcium pour renforcer le bec et les os de vos oiseaux.',
      'مصدر طبيعي للكالسيوم لتقوية منقار وعظام طيورك.',
      array['Lot de 3 pièces', '100% naturel', 'Support de fixation inclus'],
      array['عبوة من 3 قطع', '100% طبيعي', 'مع حامل تثبيت'],
      220, null, (select id from categories where slug = 'oiseaux'), 80, false, 'active'
    ),
    (
      'balancoire-cage-oiseaux',
      'Balançoire pour Cage',
      'أرجوحة للقفص',
      'Balançoire en bois naturel avec grelots colorés pour divertir vos oiseaux.',
      'أرجوحة من خشب طبيعي مزودة بأجراس ملونة لتسلية طيورك.',
      array['Bois naturel non traité', 'Grelots colorés', 'Installation facile'],
      array['خشب طبيعي غير معالج', 'أجراس ملونة', 'تركيب سهل'],
      380, 500, (select id from categories where slug = 'oiseaux'), 38, false, 'active'
    ),
    (
      'nourriture-flocons-poissons-tropicaux',
      'Nourriture en Flocons — Poissons Tropicaux',
      'طعام برقائق - أسماك استوائية',
      'Flocons nutritifs pour poissons tropicaux, favorise des couleurs vives et une bonne croissance.',
      'رقائق مغذية للأسماك الاستوائية، تعزز الألوان الزاهية والنمو الجيد.',
      array['Boîte de 100 ml', 'Riche en vitamines', 'Flottaison longue durée'],
      array['علبة 100 مل', 'غني بالفيتامينات', 'يطفو لفترة طويلة'],
      620, null, (select id from categories where slug = 'poissons'), 48, false, 'active'
    ),
    (
      'filtre-aquarium-interne-200l',
      'Filtre Aquarium Interne 200 L/h',
      'فلتر حوض داخلي 200 لتر/ساعة',
      'Filtre interne silencieux avec triple filtration (mécanique, biologique, chimique) pour aquariums jusqu''à 60 L.',
      'فلتر داخلي هادئ بثلاث مراحل ترشيح (ميكانيكي، حيوي، كيميائي) لأحواض حتى 60 لتر.',
      array['Débit 200 L/h', 'Fonctionnement silencieux', 'Cartouche remplaçable'],
      array['معدل تدفق 200 لتر/ساعة', 'تشغيل هادئ', 'خرطوشة قابلة للاستبدال'],
      4300, 5000, (select id from categories where slug = 'poissons'), 20, true, 'active'
    ),
    (
      'plante-artificielle-aquarium',
      'Plante Artificielle pour Aquarium',
      'نبتة اصطناعية لحوض السمك',
      'Plante décorative réaliste, sans entretien, pour un aquarium coloré et accueillant.',
      'نبتة زخرفية واقعية لا تحتاج صيانة، لحوض ملون ومريح للأسماك.',
      array['Hauteur 20 cm', 'Base lestée stable', 'Couleurs non toxiques'],
      array['ارتفاع 20 سم', 'قاعدة ثابتة وموزونة', 'ألوان غير سامة'],
      480, null, (select id from categories where slug = 'poissons'), 65, false, 'active'
    ),
    (
      'kit-test-qualite-eau-aquarium',
      'Kit Test Qualité d''Eau',
      'عدة اختبار جودة المياه',
      'Kit de test complet pour surveiller pH, ammoniac, nitrites et nitrates de votre aquarium.',
      'عدة اختبار شاملة لمراقبة درجة الحموضة والأمونيا والنيتريت والنترات في حوضك.',
      array['4 tests inclus', 'Résultats en 5 minutes', 'Guide de lecture inclus'],
      array['4 اختبارات مرفقة', 'نتائج خلال 5 دقائق', 'دليل قراءة مرفق'],
      1900, null, (select id from categories where slug = 'poissons'), 24, false, 'active'
    )
  returning id, slug
)
insert into product_images (product_id, url, alt, sort_order)
select p.id, '/images/seed/' || p.slug || '.svg', products.name_fr, 0
from p
join products on products.id = p.id;
