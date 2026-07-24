import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useGuestOrder } from "@/hooks/useOrders";
import { Button } from "@/components/ui/Button";
import { DogMascot } from "@/components/effects/mascots";
import { Paw } from "@/components/effects/PawScatter";
import { Price } from "@/components/ui/Price";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useSeo } from "@/hooks/useSeo";

/* One-shot celebratory paw confetti — pops in with the page, stays put. */
const CONFETTI = [
  { className: "start-[12%] top-[8%] h-7 w-7 text-brand/50", rotate: -24 },
  { className: "end-[14%] top-[12%] h-6 w-6 text-blue/50", rotate: 18 },
  { className: "start-[22%] top-[26%] h-5 w-5 text-yellow/70", rotate: 32 },
  { className: "end-[24%] top-[28%] h-6 w-6 text-green/50", rotate: -14 },
  { className: "start-[8%] top-[42%] h-5 w-5 text-blue/40", rotate: 8 },
  { className: "end-[8%] top-[45%] h-7 w-7 text-brand/40", rotate: -30 },
] as const;

export default function OrderConfirmation() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { t, lang } = useLanguage();
  const { data: order, isLoading } = useGuestOrder(orderNumber);

  useSeo({ title: t("confirmation.title"), description: t("confirmation.title") });

  return (
    <div className="bg-mesh-hero relative">
      {CONFETTI.map((paw, i) => (
        <motion.span
          key={i}
          aria-hidden
          initial={{ scale: 0.2, rotate: 0 }}
          animate={{ scale: 1, rotate: paw.rotate }}
          transition={{ delay: 0.15 + i * 0.08, type: "spring", stiffness: 300, damping: 14 }}
          className={`pointer-events-none absolute ${paw.className}`}
        >
          <Paw className="h-full w-full" />
        </motion.span>
      ))}

      <div className="relative mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <div className="relative mx-auto w-fit">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green text-green-ink shadow-[0_6px_0_0_rgb(var(--c-ink)/0.15)]">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <DogMascot className="anim-bounce-soft absolute -end-24 -top-4 h-20 w-20" />
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
            {order.items.map((item, i) => {
              const variantLabels = item.variants.map(
                (v) => `${lang === "ar" ? v.name_ar : v.name_fr}: ${v.value}`,
              );
              const specLine = [item.color, item.size, ...variantLabels].filter(Boolean).join(" · ");
              return (
                <li key={i} className="flex justify-between gap-3 py-3">
                  <span className="text-sm font-bold text-ink">
                    {lang === "ar" ? item.name_ar : item.name_fr}{" "}
                    <span className="text-muted">x{item.quantity}</span>
                    {specLine && <span className="block text-xs font-normal text-muted">{specLine}</span>}
                  </span>
                  <Price value={item.price * item.quantity} className="text-sm font-extrabold" />
                </li>
              );
            })}
          </ul>
          <div className="mt-3 space-y-1 border-t-2 border-line pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">{t("checkout.subtotal")}</span>
              <Price value={order.subtotal} className="font-bold" />
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted">{t("checkout.discount")}</span>
                <Price value={order.discount} prefix="-" className="font-bold text-green" />
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted">{t("checkout.shipping")}</span>
              <span className="font-bold">
                {order.shipping === 0 ? t("checkout.shippingFree") : <Price value={order.shipping} />}
              </span>
            </div>
            <div className="flex justify-between text-base">
              <span className="font-extrabold">{t("checkout.total")}</span>
              <Price value={order.total} className="font-extrabold text-brand" />
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
        <Button variant="brand" size="lg" className="fx-paw-sweep mt-6 hover:-rotate-1">
          {t("confirmation.backHome")}
        </Button>
      </Link>
      </div>
    </div>
  );
}
