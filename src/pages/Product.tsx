import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingBagIcon } from "@/components/icons/ShoppingBagIcon";
import { useProduct, useRelatedProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/product/ProductCard";
import { InlineCheckout } from "@/components/product/InlineCheckout";
import { Gallery, type GalleryImage } from "@/components/product/Gallery";
import { Paw } from "@/components/effects/PawScatter";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useSeo } from "@/hooks/useSeo";
import { localize } from "@/lib/format";
import { discountPercent } from "@/lib/offers";
import { useCartStore } from "@/store/cart";
import { trackAddToCart, trackViewContent } from "@/lib/pixel";
import { cn } from "@/lib/utils";
import type { ProductColor, VariantOption } from "@/types/db";

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang } = useLanguage();
  const { data: product, isLoading } = useProduct(slug);
  const { data: related } = useRelatedProducts(product?.category_id, product?.id);
  const addItem = useCartStore((s) => s.addItem);

  const [activeImage, setActiveImage] = useState(0);
  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [variantPicks, setVariantPicks] = useState<Record<string, string>>({});
  const [selErr, setSelErr] = useState(false);

  const trackedViewId = useRef<string | null>(null);

  useEffect(() => {
    if (!product) return;
    if (trackedViewId.current === product.id) return;
    trackedViewId.current = product.id;
    trackViewContent({
      content_ids: [product.id],
      content_name: product.name_fr,
      value: Number(product.price),
      currency: "DZD",
    });
  }, [product]);

  useSeo({
    title: product ? localize(product, "name", lang) : t("common.loading"),
    description: product ? (localize(product, "description", lang) || "").slice(0, 160) : "",
    image: product?.product_images?.[0]?.url,
    jsonLd: product
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: localize(product, "name", lang),
          description: localize(product, "description", lang),
          image: product.product_images?.map((img) => img.url) ?? [],
          offers: {
            "@type": "Offer",
            priceCurrency: "DZD",
            price: product.price,
            availability:
              product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          },
        }
      : undefined,
  });

  if (isLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted">{t("common.loading")}</div>;
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <p className="text-lg font-bold text-ink">{t("product.notFound")}</p>
        <Link to="/shop">
          <Button variant="outline" className="mt-4">
            {t("cart.continue")}
          </Button>
        </Link>
      </div>
    );
  }

  const images = product.product_images ?? [];
  const discount = discountPercent(product.price, product.compare_at_price);
  const isOut = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  // Real product_images come first — images[0] stays what gets snapshotted
  // into the cart/order, never a colour/variant photo. Selection photos that
  // don't already duplicate a base image are appended after.
  const galleryImages: GalleryImage[] = (() => {
    const base: GalleryImage[] = images.map((img) => ({ key: img.id, url: img.url, alt: img.alt }));
    const seen = new Set(base.map((g) => g.url));
    const extra: GalleryImage[] = [];
    const add = (url: string | null | undefined, key: string, alt: string) => {
      if (!url || seen.has(url)) return;
      seen.add(url);
      extra.push({ key, url, alt });
    };
    for (const c of product.colors) add(c.image_url, `color-${c.hex}-${c.label_fr}`, localize(c, "label", lang));
    for (const g of product.variants)
      for (const o of g.values) add(o.image_url, `var-${g.name_fr}-${o.value_fr}`, o.value_fr);
    return [...base, ...extra];
  })();

  const swapToImage = (url: string | null | undefined) => {
    if (!url) return;
    const idx = galleryImages.findIndex((g) => g.url === url);
    if (idx >= 0) setActiveImage(idx);
  };

  const handleColorSelect = (c: ProductColor) => {
    setColor(localize(c, "label", lang));
    setSelErr(false);
    swapToImage(c.image_url);
  };

  const handleVariantSelect = (groupName: string, opt: VariantOption) => {
    setVariantPicks((prev) => ({ ...prev, [groupName]: opt.value_fr }));
    setSelErr(false);
    swapToImage(opt.image_url);
  };

  const selectedVariants = product.variants
    .filter((group) => variantPicks[group.name_fr])
    .map((group) => {
      const opt = group.values.find((o) => o.value_fr === variantPicks[group.name_fr]);
      return {
        name_fr: group.name_fr,
        name_ar: group.name_ar,
        value_fr: opt?.value_fr ?? variantPicks[group.name_fr],
        value_ar: opt?.value_ar ?? variantPicks[group.name_fr],
      };
    });

  // Every axis the product defines must be chosen before it can be ordered.
  const needsColor = product.colors.length > 0 && !color;
  const needsSize = product.sizes.length > 0 && !size;
  const missingGroups = product.variants.filter((g) => !variantPicks[g.name_fr]);
  const selectionComplete = !needsColor && !needsSize && missingGroups.length === 0;

  const handleAddToCart = () => {
    if (!selectionComplete) {
      setSelErr(true);
      return;
    }
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name_fr: product.name_fr,
        name_ar: product.name_ar,
        price: Number(product.price),
        image: images[0]?.url ?? null,
        color,
        size,
        variants: selectedVariants,
        quantityOffers: product.quantity_offers,
        stock: product.stock,
      },
      quantity,
    );
    trackAddToCart({
      content_ids: [product.id],
      content_name: product.name_fr,
      value: Number(product.price) * quantity,
      currency: "DZD",
    });
  };

  return (
    <div className="bg-tint-blue">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <Gallery images={galleryImages} activeIndex={activeImage} onActiveChange={setActiveImage} />

          {product.video_url && (
            <video
              src={product.video_url}
              controls
              preload="none"
              poster={images[0]?.url}
              className="mt-4 w-full rounded-2xl border-2 border-line"
            />
          )}
        </div>

        {/* Info */}
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">
            {localize(product, "name", lang)}
          </h1>

          <div className="mt-3 flex items-center gap-3">
            <Price value={product.price} className="text-2xl font-extrabold text-brand" />
            {discount && (
              <>
                <Price
                  value={product.compare_at_price!}
                  className="text-base text-muted line-through"
                />
                <Badge tone="brand">-{discount}%</Badge>
              </>
            )}
          </div>

          <div className="mt-2">
            {isOut ? (
              <Badge tone="neutral">{t("product.outOfStock")}</Badge>
            ) : lowStock ? (
              <Badge tone="yellow">{t("product.lowStock")}</Badge>
            ) : (
              <Badge tone="green">{t("product.inStock")}</Badge>
            )}
          </div>

          {localize(product, "description", lang) && (
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {localize(product, "description", lang)}
            </p>
          )}

          {product.colors.length > 0 && (
            <div
              className={cn(
                "mt-5 rounded-2xl p-3 transition-colors",
                selErr && needsColor ? "bg-brand/5 ring-2 ring-brand" : "-mx-3",
              )}
            >
              <p className="mb-2 text-sm font-bold text-ink">
                {t("product.color")} <span className="text-brand">*</span>
              </p>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((c) => {
                  const label = localize(c, "label", lang);
                  const isActive = color === label;
                  return (
                    <button
                      key={`${c.hex}-${label}`}
                      type="button"
                      onClick={() => handleColorSelect(c)}
                      title={label}
                      aria-label={label}
                      aria-pressed={isActive}
                      className={`relative h-9 w-9 shrink-0 rounded-full border-2 transition-transform hover:scale-110 ${isActive ? "border-brand ring-2 ring-brand/30" : "border-line"}`}
                    >
                      <span
                        aria-hidden
                        className="absolute inset-1 rounded-full shadow-inner"
                        style={{ backgroundColor: c.hex || "#a1a1aa" }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {product.sizes.length > 0 && (
            <div
              className={cn(
                "mt-4 rounded-2xl p-3 transition-colors",
                selErr && needsSize ? "bg-brand/5 ring-2 ring-brand" : "-mx-3",
              )}
            >
              <p className="mb-2 text-sm font-bold text-ink">
                {t("product.size")} <span className="text-brand">*</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSize(s);
                      setSelErr(false);
                    }}
                    className={`rounded-full border-2 px-3 py-1.5 text-sm font-bold ${size === s ? "border-brand bg-brand/10 text-brand" : "border-line text-ink"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.variants.map((group) => {
            const missing = selErr && !variantPicks[group.name_fr];
            return (
              <div
                key={group.name_fr}
                className={cn(
                  "mt-4 rounded-2xl p-3 transition-colors",
                  missing ? "bg-brand/5 ring-2 ring-brand" : "-mx-3",
                )}
              >
                <p className="mb-2 text-sm font-bold text-ink">
                  {lang === "ar" ? group.name_ar : group.name_fr}{" "}
                  <span className="text-brand">*</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.values.map((opt) => {
                    const active = variantPicks[group.name_fr] === opt.value_fr;
                    const label = (lang === "ar" ? opt.value_ar : opt.value_fr) || opt.value_fr;
                    return (
                      <button
                        key={opt.value_fr}
                        onClick={() => handleVariantSelect(group.name_fr, opt)}
                        className={`flex items-center gap-2 rounded-full border-2 py-1.5 pe-3 text-sm font-bold ${
                          opt.image_url ? "ps-1.5" : "ps-3"
                        } ${active ? "border-brand bg-brand/10 text-brand" : "border-line text-ink"}`}
                      >
                        {opt.image_url && (
                          <img
                            src={opt.image_url}
                            alt=""
                            width={28}
                            height={28}
                            loading="lazy"
                            decoding="async"
                            className="h-7 w-7 rounded-full object-cover"
                          />
                        )}
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {!isOut && (
            <div className="mt-5 flex items-center gap-3">
              <p className="text-sm font-bold text-ink">{t("product.quantity")}</p>
              <div className="flex items-center gap-3 rounded-full border-2 border-blue/40 bg-blue/5 px-3 py-1">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="text-lg font-bold text-blue transition-transform hover:scale-125"
                >
                  −
                </button>
                <span className="min-w-4 text-center font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="text-lg font-bold text-blue transition-transform hover:scale-125"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {!isOut && (
            <div className="mt-6">
              {selErr && !selectionComplete && (
                <p className="mb-2 text-sm font-bold text-brand">{t("product.selectOptions")}</p>
              )}
              <div className="flex gap-3">
                <Button variant="blue" size="lg" onClick={handleAddToCart} className="fx-paw-sweep flex-1 gap-2 hover:-rotate-1">
                  <ShoppingBagIcon className="h-4 w-4" />
                  {t("product.addToCart")}
                </Button>
              </div>
            </div>
          )}

          {product.details_fr.length > 0 && (
            <div className="mt-6 rounded-2xl border-2 border-green/30 bg-green/5 p-4">
              <p className="mb-2 text-sm font-extrabold text-green">{t("product.details")}</p>
              <ul className="space-y-1.5 text-sm text-muted">
                {(lang === "ar" ? product.details_ar : product.details_fr).map((d, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Paw className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green/60" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!isOut && (
            <div className="mt-8 rounded-3xl bg-gradient-to-br from-brand via-yellow to-blue p-[3px] shadow-xl">
              <div className="rounded-[calc(1.5rem-3px)] bg-panel p-5">
                <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-extrabold text-ink">
                  <Paw className="h-5 w-5 text-brand" />
                  {t("product.buyNow")}
                </h2>
                <InlineCheckout
                  product={product}
                  color={color}
                  size={size}
                  variants={selectedVariants}
                  quantity={quantity}
                  selectionComplete={selectionComplete}
                  onBlockedSubmit={() => setSelErr(true)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {related && related.length > 0 && (
        <section className="mt-16">
          <h2 className="squiggle mb-6 inline-block font-display text-xl font-extrabold text-ink">
            {t("product.related")}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
      </div>
    </div>
  );
}
