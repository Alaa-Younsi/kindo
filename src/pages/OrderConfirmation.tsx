import { Link, useParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useGuestOrder } from "@/hooks/useOrders";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useSeo } from "@/hooks/useSeo";
import { formatPrice } from "@/lib/format";

export default function OrderConfirmation() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { t, lang } = useLanguage();
  const { data: order, isLoading } = useGuestOrder(orderNumber);

  useSeo({ title: t("confirmation.title"), description: t("confirmation.title") });

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green/15 text-green">
        <CheckCircle2 className="h-9 w-9" />
      </div>
      <h1 className="mt-5 font-display text-3xl font-extrabold text-ink">{t("confirmation.title")}</h1>
      <p className="mt-2 text-muted">{t("confirmation.subtitle")}</p>

      <div className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-brand/30 bg-brand/5 px-5 py-2.5">
        <span className="text-sm text-muted">{t("confirmation.orderNumber")}</span>
        <span className="font-mono text-sm font-extrabold text-brand" dir="ltr">
          {orderNumber}
        </span>
      </div>

      {!isLoading && order && (
        <div className="mt-8 rounded-2xl border-2 border-line bg-panel p-6 text-start">
          <ul className="divide-y-2 divide-line">
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between gap-3 py-3">
                <span className="text-sm font-bold text-ink">
                  {lang === "ar" ? item.name_ar : item.name_fr}{" "}
                  <span className="text-muted">x{item.quantity}</span>
                </span>
                <span className="text-sm font-extrabold">{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 border-t-2 border-line pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">{t("checkout.subtotal")}</span>
              <span className="font-bold">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">{t("checkout.shipping")}</span>
              <span className="font-bold">
                {order.shipping === 0 ? t("checkout.shippingFree") : formatPrice(order.shipping)}
              </span>
            </div>
            <div className="flex justify-between text-base">
              <span className="font-extrabold">{t("checkout.total")}</span>
              <span className="font-extrabold text-brand">{formatPrice(order.total)}</span>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted">
            {order.customer_name} · {order.city}, {order.wilaya}
          </p>
        </div>
      )}

      {!isLoading && !order && <p className="mt-6 text-muted">{t("confirmation.notFound")}</p>}

      <p className="mt-6 text-sm text-muted">{t("confirmation.willCall")}</p>

      <Link to="/">
        <Button variant="brand" size="lg" className="mt-6">
          {t("confirmation.backHome")}
        </Button>
      </Link>
    </div>
  );
}
