import { Link } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";
import { CatMascot } from "@/components/effects/mascots";
import { useCartStore } from "@/store/cart";
import { useLanguage } from "@/i18n/LanguageProvider";
import { lineTotal } from "@/lib/offers";

export function CartDrawer() {
  const { t, lang, dir } = useLanguage();
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const cartTotal = items.reduce(
    (sum, line) => sum + lineTotal(line.price, line.quantity, line.quantityOffers),
    0,
  );

  return (
    <Drawer
      open={isOpen}
      onClose={closeCart}
      side={dir === "rtl" ? "left" : "right"}
      title={t("cart.title")}
    >
      {items.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
          <span className="flex h-32 w-32 items-center justify-center rounded-full bg-blue/10">
            <CatMascot className="h-24 w-24" />
          </span>
          <p className="font-extrabold text-ink">{t("cart.empty")}</p>
          <p className="text-sm text-muted">{t("cart.emptySubtitle")}</p>
          <Button variant="brand" onClick={closeCart} className="mt-2 hover:-rotate-1">
            {t("cart.continue")}
          </Button>
        </div>
      ) : (
        <div className="flex h-full flex-col">
          <ul className="flex-1 divide-y-2 divide-line overflow-y-auto px-5">
            {items.map((line) => {
              const variantLabels = line.variants.map(
                (v) => `${lang === "ar" ? v.name_ar : v.name_fr}: ${v.value}`,
              );
              return (
                <li
                  key={`${line.productId}-${line.color}-${line.size}-${line.variants.map((v) => v.value).join(",")}`}
                  className="flex gap-3 py-4"
                >
                  <Link
                    to={`/product/${line.slug}`}
                    onClick={closeCart}
                    className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-panel-2"
                  >
                    {line.image && (
                      <img
                        src={line.image}
                        alt={lang === "ar" ? line.name_ar : line.name_fr}
                        width={80}
                        height={80}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <Link
                      to={`/product/${line.slug}`}
                      onClick={closeCart}
                      className="text-sm font-bold text-ink hover:text-brand"
                    >
                      {lang === "ar" ? line.name_ar : line.name_fr}
                    </Link>
                    {(line.color || line.size || variantLabels.length > 0) && (
                      <p className="text-xs text-muted">
                        {[line.color, line.size, ...variantLabels].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-full border-2 border-blue/40 bg-blue/5 px-1">
                        <button
                          onClick={() =>
                            updateQuantity(
                              line.productId,
                              line.color,
                              line.size,
                              line.variants,
                              line.quantity - 1,
                            )
                          }
                          className="p-1 text-blue transition-transform hover:scale-125"
                          aria-label="-"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-4 text-center text-sm font-bold">{line.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              line.productId,
                              line.color,
                              line.size,
                              line.variants,
                              Math.min(line.quantity + 1, line.stock || 99),
                            )
                          }
                          className="p-1 text-blue transition-transform hover:scale-125"
                          aria-label="+"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <Price
                        value={lineTotal(line.price, line.quantity, line.quantityOffers)}
                        className="text-sm font-extrabold text-brand"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(line.productId, line.color, line.size, line.variants)}
                    aria-label={t("cart.remove")}
                    className="self-start p-1 text-muted hover:text-brand"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="border-t-2 border-line px-5 py-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-bold text-ink">{t("cart.subtotal")}</span>
              <Price value={cartTotal} className="text-lg font-extrabold text-ink" />
            </div>
            <Link to="/checkout" onClick={closeCart}>
              <Button variant="brand" size="lg" className="w-full">
                {t("cart.checkout")}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </Drawer>
  );
}
