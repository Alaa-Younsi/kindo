-- KINDO — swap demo product placeholders for real (freely-licensed) animal photos
-- Run after 0006_seed_products.sql. Safe to re-run.
-- Photos are CC0 / CC BY / CC BY-SA from Wikimedia Commons — see
-- public/images/products/CREDITS.json for per-photo attribution.

update product_images pi
set url = '/images/products/' || p.slug || '.webp'
from products p
where pi.product_id = p.id
  and p.slug in (
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
  );
