import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Price } from "@/components/ui/Price";
import { SmartImage } from "@/components/ui/SmartImage";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCartStore } from "@/store/cart";
import {
  useDeliveryPrices,
  useStoreSettings,
  resolveShipping,
  wilayaFeeFor,
} from "@/hooks/useStoreSettings";
import { usePlaceOrder } from "@/hooks/useOrders";
import { useHoneypot } from "@/hooks/useHoneypot";
import { checkoutSchema, type CheckoutFormValues } from "@/lib/checkoutSchema";
import { lineTotal } from "@/lib/offers";
import { orderErrorKey } from "@/lib/orderErrors";
import { trackInitiateCheckout, trackPurchase } from "@/lib/pixel";
import { useSeo } from "@/hooks/useSeo";
import type { TranslationKey } from "@/i18n/translations";

export default function Checkout() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const clearCart = useCartStore((s) => s.clear);

  const { data: deliveryPrices } = useDeliveryPrices();
  const { data: settings } = useStoreSettings();
  const placeOrder = usePlaceOrder();
  const { isSpam } = useHoneypot();
  const [submitError, setSubmitError] = useState<TranslationKey | null>(null);
  const trackedInitiate = useRef(false);

  useSeo({ title: t("checkout.title"), description: t("checkout.title") });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { delivery_type: "home" },
  });

  const wilaya = watch("wilaya");
  const deliveryType = watch("delivery_type");

  const activeWilayas = useMemo(
    () => (deliveryPrices ?? []).filter((d) => d.active),
    [deliveryPrices],
  );

  const goodsAfterDiscount = items.reduce(
    (sum, line) => sum + lineTotal(line.price, line.quantity, line.quantityOffers),
    0,
  );
  const discount = subtotal - goodsAfterDiscount;
  const wilayaFee = wilayaFeeFor(deliveryPrices ?? [], wilaya, deliveryType);
  const shipping = resolveShipping(wilayaFee, goodsAfterDiscount, settings);
  const total = goodsAfterDiscount + (shipping ?? 0);

  useEffect(() => {
    if (trackedInitiate.current || items.length === 0) return;
    trackedInitiate.current = true;
    trackInitiateCheckout({
      content_ids: items.map((i) => i.productId),
      value: subtotal,
      currency: "DZD",
      num_items: items.reduce((sum, i) => sum + i.quantity, 0),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (values: CheckoutFormValues) => {
    setSubmitError(null);
    if (isSpam(values.website)) return;

    try {
      const orderNumber = await placeOrder.mutateAsync({
        items: items.map((line) => ({
          product_id: line.productId,
          quantity: line.quantity,
          color: line.color,
          size: line.size,
          variants: line.variants,
        })),
        customer: {
          name: values.name,
          phone: values.phone,
          wilaya: values.wilaya,
          city: values.city,
          delivery_type: values.delivery_type,
          language: lang,
        },
      });

      trackPurchase({
        content_ids: items.map((i) => i.productId),
        value: total,
        currency: "DZD",
        order_id: orderNumber,
      });

      clearCart();
      navigate(`/order-confirmation/${orderNumber}`);
    } catch (err) {
      setSubmitError(orderErrorKey(err));
    }
  };

  if (items.length === 0) {
    return <Navigate to="/shop" replace />;
  }

  return (
    <div className="bg-tint-green">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="squiggle inline-block font-display text-3xl font-extrabold text-ink">
        {t("checkout.title")}
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <input type="text" {...register("website")} className="hidden" tabIndex={-1} autoComplete="off" />

          <h2 className="font-display text-lg font-extrabold text-ink">{t("checkout.customerInfo")}</h2>

          <div>
            <Input placeholder={t("checkout.name")} {...register("name")} />
            {errors.name && <p className="mt-1 text-xs text-brand">{t("error.ERR_INVALID_INPUT")}</p>}
          </div>
          <div>
            <Input placeholder={t("checkout.phone")} type="tel" dir="ltr" {...register("phone")} />
            {errors.phone && <p className="mt-1 text-xs text-brand">{t("error.ERR_INVALID_INPUT")}</p>}
          </div>
          <div>
            <Select {...register("wilaya")} defaultValue="">
              <option value="" disabled>
                {t("checkout.wilayaPlaceholder")}
              </option>
              {activeWilayas.map((w) => (
                <option key={w.wilaya} value={w.wilaya}>
                  {w.wilaya}
                </option>
              ))}
            </Select>
            {errors.wilaya && <p className="mt-1 text-xs text-brand">{t("error.ERR_INVALID_INPUT")}</p>}
          </div>
          <div>
            <Input placeholder={t("checkout.city")} {...register("city")} />
            {errors.city && <p className="mt-1 text-xs text-brand">{t("error.ERR_INVALID_INPUT")}</p>}
          </div>

          <div>
            <p className="mb-2 text-sm font-bold text-ink">{t("checkout.deliveryType")}</p>
            <div className="flex gap-2">
              <label className="flex flex-1 cursor-pointer items-center justify-center rounded-xl border-2 border-line px-3 py-2 text-sm font-bold has-[:checked]:border-blue has-[:checked]:bg-blue/10 has-[:checked]:text-blue">
                <input type="radio" value="home" {...register("delivery_type")} className="hidden" />
                {t("checkout.deliveryHome")}
              </label>
              <label className="flex flex-1 cursor-pointer items-center justify-center rounded-xl border-2 border-line px-3 py-2 text-sm font-bold has-[:checked]:border-blue has-[:checked]:bg-blue/10 has-[:checked]:text-blue">
                <input type="radio" value="office" {...register("delivery_type")} className="hidden" />
                {t("checkout.deliveryOffice")}
              </label>
            </div>
          </div>

          {submitError && <p className="text-sm font-bold text-brand">{t(submitError)}</p>}

          <Button type="submit" variant="brand" size="lg" disabled={isSubmitting} className="mt-2 w-full">
            {isSubmitting ? t("checkout.submitting") : t("checkout.submit")}
          </Button>
          <p className="text-center text-xs text-muted">{t("checkout.codNotice")}</p>
        </form>

        <div>
          <h2 className="mb-4 font-display text-lg font-extrabold text-ink">{t("checkout.summary")}</h2>
          <ul className="divide-y-2 divide-line rounded-2xl border-2 border-line bg-panel">
            {items.map((line) => {
              const variantLabels = line.variants.map(
                (v) => `${lang === "ar" ? v.name_ar : v.name_fr}: ${v.value}`,
              );
              return (
                <li
                  key={`${line.productId}-${line.color}-${line.size}-${line.variants.map((v) => v.value).join(",")}`}
                  className="flex gap-3 p-4"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-panel-2">
                    {line.image && (
                      <SmartImage
                        src={line.image}
                        alt=""
                        width={56}
                        height={56}
                        sizes="56px"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-ink">
                      {lang === "ar" ? line.name_ar : line.name_fr}
                    </p>
                    {(line.color || line.size || variantLabels.length > 0) && (
                      <p className="text-xs text-muted">
                        {[line.color, line.size, ...variantLabels].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    <p className="text-xs text-muted">
                      {t("product.quantity")}: {line.quantity}
                    </p>
                  </div>
                  <Price
                    value={lineTotal(line.price, line.quantity, line.quantityOffers)}
                    className="text-sm font-extrabold text-ink"
                  />
                </li>
              );
            })}
          </ul>

          <div className="mt-4 rounded-2xl bg-gradient-to-br from-green via-blue to-brand p-[3px] shadow-lg">
            <div className="rounded-[calc(1rem-3px)] bg-panel p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">{t("checkout.subtotal")}</span>
                <Price value={subtotal} className="font-bold" />
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted">{t("checkout.discount")}</span>
                  <Price value={discount} prefix="-" className="font-bold text-green" />
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted">{t("checkout.shipping")}</span>
                <span className="font-bold text-green">
                  {shipping === null ? (
                    t("checkout.shippingUnknown")
                  ) : shipping === 0 ? (
                    t("checkout.shippingFree")
                  ) : (
                    <Price value={shipping} />
                  )}
                </span>
              </div>
              <div className="mt-2 flex justify-between border-t-2 border-line pt-2 text-base">
                <span className="font-extrabold">{t("checkout.total")}</span>
                <Price value={total} className="font-extrabold text-brand" />
              </div>
            </div>
          </div>

          <Link to="/shop" className="mt-3 inline-block text-sm font-bold text-blue hover:underline">
            {t("cart.continue")}
          </Link>
        </div>
      </div>
      </div>
    </div>
  );
}
