import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ImageOff } from "lucide-react";
import { ShoppingBagIcon } from "@/components/icons/ShoppingBagIcon";
import { TiltCard } from "@/components/effects/TiltCard";
import { useLanguage } from "@/i18n/LanguageProvider";
import { localize } from "@/lib/format";
import { discountPercent } from "@/lib/offers";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { useCartStore } from "@/store/cart";
import { trackAddToCart } from "@/lib/pixel";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/db";

const HOVER_TONES = [
  "hover:border-brand hover:shadow-[0_14px_30px_-10px_rgb(var(--c-brand)/0.45)]",
  "hover:border-blue hover:shadow-[0_14px_30px_-10px_rgb(var(--c-blue)/0.45)]",
  "hover:border-green hover:shadow-[0_14px_30px_-10px_rgb(var(--c-green)/0.45)]",
  "hover:border-yellow hover:shadow-[0_14px_30px_-10px_rgb(var(--c-yellow)/0.55)]",
] as const;

/* Stable per-product accent so a card keeps its color across re-renders. */
function accentIndex(id: string): number {
  return (id.charCodeAt(0) + id.charCodeAt(id.length - 1)) % HOVER_TONES.length;
}

export function ProductCard({ product }: { product: Product }) {
  const { t, lang } = useLanguage();
  const addItem = useCartStore((s) => s.addItem);

  const image = product.product_images?.[0];
  const discount = discountPercent(product.price, product.compare_at_price);
  const isOut = product.stock <= 0;
  const tone = HOVER_TONES[accentIndex(product.id)];

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOut) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      name_fr: product.name_fr,
      name_ar: product.name_ar,
      price: Number(product.price),
      image: image?.url ?? null,
      color: null,
      size: null,
      variants: [],
      quantityOffers: product.quantity_offers,
      stock: product.stock,
    });
    trackAddToCart({
      content_ids: [product.id],
      content_name: product.name_fr,
      value: Number(product.price),
      currency: "DZD",
    });
  };

  return (
    <TiltCard max={8} className="h-full">
      <Link
        to={`/product/${product.slug}`}
        className={cn(
          "group flex h-full flex-col overflow-hidden rounded-3xl border-2 border-line bg-panel transition-all duration-200 hover:-translate-y-1.5",
          tone,
        )}
      >
        <div className="relative aspect-square overflow-hidden bg-panel-2">
          {image ? (
            <img
              src={image.url}
              alt={image.alt ?? localize(product, "name", lang)}
              width={400}
              height={400}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:rotate-1 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-line">
              <ImageOff className="h-10 w-10" />
            </div>
          )}

          <div className="absolute start-2 top-2 flex flex-col gap-1.5">
            {discount && (
              <span className="rotate-[-6deg] rounded-lg bg-brand px-2.5 py-1 text-xs font-extrabold text-brand-ink shadow-md transition-transform group-hover:rotate-0">
                -{discount}%
              </span>
            )}
            {isOut && (
              <Badge tone="neutral" className="shadow">
                {t("product.outOfStock")}
              </Badge>
            )}
          </div>

          {!isOut && (
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={handleQuickAdd}
              aria-label={t("product.addToCart")}
              className="absolute bottom-2 end-2 flex h-11 w-11 items-center justify-center rounded-full bg-green text-green-ink opacity-0 shadow-lg transition-all duration-200 hover:rotate-12 hover:brightness-105 group-hover:opacity-100"
            >
              <ShoppingBagIcon className="h-4.5 w-4.5" />
            </motion.button>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-4">
          <h3 className="line-clamp-2 text-sm font-bold text-ink transition-colors group-hover:text-brand">
            {localize(product, "name", lang)}
          </h3>
          <div className="mt-auto flex items-center gap-2 pt-2">
            <Price
              value={product.price}
              className="rounded-lg bg-brand/10 px-2 py-0.5 text-base font-extrabold text-brand"
            />
            {product.compare_at_price && product.compare_at_price > product.price && (
              <Price value={product.compare_at_price} className="text-xs text-muted line-through" />
            )}
          </div>
        </div>
      </Link>
    </TiltCard>
  );
}
