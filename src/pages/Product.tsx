import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ImageOff, ShoppingBag } from "lucide-react";
import { useProduct, useRelatedProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/product/ProductCard";
import { InlineCheckout } from "@/components/product/InlineCheckout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useSeo } from "@/hooks/useSeo";
import { formatPrice, localize } from "@/lib/format";
import { discountPercent } from "@/lib/offers";
import { useCartStore } from "@/store/cart";
import { trackAddToCart, trackViewContent } from "@/lib/pixel";

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

  const handleAddToCart = () => {
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
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="aspect-square overflow-hidden rounded-3xl border-2 border-line bg-panel-2">
            {images[activeImage] ? (
              <img
                src={images[activeImage].url}
                alt={images[activeImage].alt ?? localize(product, "name", lang)}
                width={600}
                height={600}
                loading="eager"
                fetchPriority="high"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-line">
                <ImageOff className="h-16 w-16" />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${i === activeImage ? "border-brand" : "border-line"}`}
                >
                  <img
                    src={img.url}
                    alt=""
                    width={64}
                    height={64}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

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
            <span className="text-2xl font-extrabold text-brand">{formatPrice(product.price)}</span>
            {discount && (
              <>
                <span className="text-base text-muted line-through">
                  {formatPrice(product.compare_at_price!)}
                </span>
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
            <div className="mt-5">
              <p className="mb-2 text-sm font-bold text-ink">{t("product.color")}</p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`rounded-full border-2 px-3 py-1.5 text-sm font-bold ${color === c ? "border-brand bg-brand/10 text-brand" : "border-line text-ink"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.sizes.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-bold text-ink">{t("product.size")}</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`rounded-full border-2 px-3 py-1.5 text-sm font-bold ${size === s ? "border-brand bg-brand/10 text-brand" : "border-line text-ink"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isOut && (
            <div className="mt-5 flex items-center gap-3">
              <p className="text-sm font-bold text-ink">{t("product.quantity")}</p>
              <div className="flex items-center gap-3 rounded-full border-2 border-line px-3 py-1">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="text-lg font-bold">
                  −
                </button>
                <span className="min-w-4 text-center font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="text-lg font-bold"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {!isOut && (
            <div className="mt-6 flex gap-3">
              <Button variant="outline" size="lg" onClick={handleAddToCart} className="flex-1 gap-2">
                <ShoppingBag className="h-4 w-4" />
                {t("product.addToCart")}
              </Button>
            </div>
          )}

          {product.details_fr.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-bold text-ink">{t("product.details")}</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted">
                {(lang === "ar" ? product.details_ar : product.details_fr).map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}

          {!isOut && (
            <div className="mt-8 rounded-3xl border-2 border-brand/30 bg-brand/5 p-5">
              <h2 className="mb-4 font-display text-lg font-extrabold text-ink">
                {t("product.buyNow")}
              </h2>
              <InlineCheckout product={product} color={color} size={size} quantity={quantity} />
            </div>
          )}
        </div>
      </div>

      {related && related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 font-display text-xl font-extrabold text-ink">{t("product.related")}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
