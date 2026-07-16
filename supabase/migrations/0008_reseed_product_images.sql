-- KINDO — re-populate product_images (found empty: products/categories seeded fine,
-- but product_images had 0 rows, so every demo product showed a broken image).
-- Idempotent: only inserts for products that don't already have an image.

insert into product_images (product_id, url, alt, sort_order)
select p.id, '/images/products/' || p.slug || '.webp', p.name_fr, 0
from products p
where p.slug in (
    'croquettes-chien-adulte-volaille-riz',
    'laisse-chien-corde-tressee',
    'panier-chien-moelleux',
    'jouet-chien-corde-a-macher',
    'croquettes-chat-sterilise-saumon',
    'litiere-chat-agglomerante-lavande',
    'arbre-a-chat-3-plateformes',
    'jouet-chat-plume-interactif',
    'melange-graines-perruches-canaris',
    'cage-oiseaux-perchoirs',
    'os-de-seiche-oiseaux',
    'balancoire-cage-oiseaux',
    'nourriture-flocons-poissons-tropicaux',
    'filtre-aquarium-interne-200l',
    'plante-artificielle-aquarium',
    'kit-test-qualite-eau-aquarium'
  )
  and not exists (
    select 1 from product_images pi where pi.product_id = p.id
  );
