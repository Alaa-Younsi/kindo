import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Price } from "@/components/ui/Price";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useDeliveryPrices, useStoreSettings, resolveShipping, wilayaFeeFor } from "@/hooks/useStoreSettings";
import { usePlaceOrder } from "@/hooks/useOrders";
import { useHoneypot } from "@/hooks/useHoneypot";
import { checkoutSchema, type CheckoutFormValues } from "@/lib/checkoutSchema";
import { lineTotal } from "@/lib/offers";
import { orderErrorKey } from "@/lib/orderErrors";
import { trackInitiateCheckout, trackPurchase } from "@/lib/pixel";
import type { TranslationKey } from "@/i18n/translations";
import type { Product, VariantPick } from "@/types/db";

interface InlineCheckoutProps {
  product: Product;
  color: string | null;
  size: string | null;
  variants: VariantPick[];
  quantity: number;
}

export function InlineCheckout({ product, color, size, variants, quantity }: InlineCheckoutProps) {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const { data: deliveryPrices } = useDeliveryPrices();
  const { data: settings } = useStoreSettings();
  const placeOrder = usePlaceOrder();
  const { isSpam } = useHoneypot();
  const [submitError, setSubmitError] = useState<TranslationKey | null>(null);
  const trackedCheckoutId = useRef<string | null>(null);

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

  const goodsSubtotal = product.price * quantity;
  const goodsAfterDiscount = lineTotal(product.price, quantity, product.quantity_offers);
  const wilayaFee = wilayaFeeFor(deliveryPrices ?? [], wilaya, deliveryType);
  const shipping = resolveShipping(wilayaFee, goodsAfterDiscount, settings);
  const total = goodsAfterDiscount + (shipping ?? 0);

  const handleFormFocus = () => {
    if (trackedCheckoutId.current === product.id) return;
    trackedCheckoutId.current = product.id;
    trackInitiateCheckout({
      content_ids: [product.id],
      value: goodsSubtotal,
      currency: "DZD",
      num_items: quantity,
    });
  };

  const onSubmit = async (values: CheckoutFormValues) => {
    setSubmitError(null);
    if (isSpam(values.website)) return;

    try {
      const orderNumber = await placeOrder.mutateAsync({
        items: [{ product_id: product.id, quantity, color, size, variants }],
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
        content_ids: [product.id],
        value: total,
        currency: "DZD",
        order_id: orderNumber,
      });

      navigate(`/order-confirmation/${orderNumber}`);
    } catch (err) {
      setSubmitError(orderErrorKey(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} onFocus={handleFormFocus} className="flex flex-col gap-3">
      <input type="text" {...register("website")} className="hidden" tabIndex={-1} autoComplete="off" />

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

      <div className="rounded-xl bg-panel-2 p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">{t("checkout.subtotal")}</span>
          <Price value={goodsSubtotal} className="font-bold" />
        </div>
        {goodsAfterDiscount < goodsSubtotal && (
          <div className="flex justify-between">
            <span className="text-muted">{t("checkout.discount")}</span>
            <Price
              value={goodsSubtotal - goodsAfterDiscount}
              prefix="-"
              className="font-bold text-green"
            />
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted">{t("checkout.shipping")}</span>
          <span className="font-bold">
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

      {submitError && <p className="text-sm font-bold text-brand">{t(submitError)}</p>}

      <Button type="submit" variant="brand" size="lg" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t("checkout.submitting") : t("product.buyNow")}
      </Button>
      <p className="text-center text-xs text-muted">{t("checkout.codNotice")}</p>
    </form>
  );
}
