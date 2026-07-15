import { Link } from "react-router-dom";
import { ImageOff, ShoppingBag } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatPrice, localize } from "@/lib/format";
import { discountPercent } from "@/lib/offers";
import { Badge } from "@/components/ui/Badge";
import { useCartStore } from "@/store/cart";
import { trackAddToCart } from "@/lib/pixel";
import type { Product } from "@/types/db";

export function ProductCard({ product }: { product: Product }) {
  const { t, lang } = useLanguage();
  const addItem = useCartStore((s) => s.addItem);

  const image = product.product_images?.[0];
  const discount = discountPercent(product.price, product.compare_at_price);
  const isOut = product.stock <= 0;

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
    <Link
      to={`/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border-2 border-line bg-panel transition-all hover:-translate-y-1 hover:border-brand hover:shadow-lg"
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
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-line">
            <ImageOff className="h-10 w-10" />
          </div>
        )}

        <div className="absolute start-2 top-2 flex flex-col gap-1.5">
          {discount && (
            <Badge tone="brand" className="shadow">
              -{discount}%
            </Badge>
          )}
          {isOut && (
            <Badge tone="neutral" className="shadow">
              {t("product.outOfStock")}
            </Badge>
          )}
        </div>

        {!isOut && (
          <button
            onClick={handleQuickAdd}
            aria-label={t("product.addToCart")}
            className="absolute bottom-2 end-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue text-blue-ink opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 hover:brightness-105 active:scale-95"
          >
            <ShoppingBag className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-2 text-sm font-bold text-ink">
          {localize(product, "name", lang)}
        </h3>
        <div className="mt-auto flex items-center gap-2 pt-2">
          <span className="text-base font-extrabold text-brand">
            {formatPrice(product.price)}
          </span>
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span className="text-xs text-muted line-through">
              {formatPrice(product.compare_at_price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
