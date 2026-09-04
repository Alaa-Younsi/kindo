import { useParams } from "react-router-dom";
import { useAdminOrder, useUpdateOrderStatus } from "@/hooks/useOrders";
import { Select } from "@/components/ui/Select";
import { BentoPanel } from "@/components/ui/BentoPanel";
import { Price } from "@/components/ui/Price";
import { SmartImage } from "@/components/ui/SmartImage";
import { useAdminToast } from "@/components/admin/AdminToast";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatDate, variantSummary } from "@/lib/format";
import type { OrderStatus } from "@/types/db";

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useLanguage();
  const { toast } = useAdminToast();
  const { data: order, isLoading, isError } = useAdminOrder(id);
  const updateStatus = useUpdateOrderStatus();

  if (isLoading) {
    return <p className="text-muted">{t("common.loading")}</p>;
  }
  if (isError || !order) {
    return <p className="text-brand">{t("admin.loadError")}</p>;
  }

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold text-ink" dir="ltr">
          {order.order_number}
        </h1>
        <Select
          value={order.status}
          onChange={(e) =>
            updateStatus.mutate(
              { id: order.id, status: e.target.value as OrderStatus },
              {
                onSuccess: () => toast(t("admin.saved")),
                onError: () => toast(t("admin.saveError"), "error"),
              },
            )
          }
          wrapperClassName="w-48"
        >
          <option value="pending">{t("admin.orders.status.pending")}</option>
          <option value="confirmed">{t("admin.orders.status.confirmed")}</option>
          <option value="shipped">{t("admin.orders.status.shipped")}</option>
          <option value="delivered">{t("admin.orders.status.delivered")}</option>
          <option value="cancelled">{t("admin.orders.status.cancelled")}</option>
        </Select>
      </div>
      <p className="mt-1 text-sm text-muted">{formatDate(order.created_at, lang)}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <BentoPanel>
          <h2 className="mb-3 font-display text-sm font-extrabold uppercase text-muted">
            {t("checkout.customerInfo")}
          </h2>
          <p className="font-bold text-ink">{order.customer_name}</p>
          <p className="text-sm text-ink" dir="ltr">
            {order.customer_phone}
          </p>
          <p className="mt-2 text-sm text-muted">
            {order.city}, {order.wilaya}
          </p>
          {order.address && <p className="text-sm text-muted">{order.address}</p>}
          {order.notes && <p className="mt-2 text-sm italic text-muted">{order.notes}</p>}
          <p className="mt-2 text-sm text-muted">
            {order.delivery_type === "home" ? t("checkout.deliveryHome") : t("checkout.deliveryOffice")}
          </p>
        </BentoPanel>

        <BentoPanel>
          <h2 className="mb-3 font-display text-sm font-extrabold uppercase text-muted">
            {t("checkout.summary")}
          </h2>
          <div className="flex justify-between text-sm">
            <span className="text-muted">{t("checkout.subtotal")}</span>
            <Price value={order.subtotal} className="font-bold" />
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted">{t("checkout.discount")}</span>
              <Price value={order.discount} prefix="-" className="font-bold text-green" />
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted">{t("checkout.shipping")}</span>
            <Price value={order.shipping} className="font-bold" />
          </div>
          <div className="mt-2 flex justify-between border-t-2 border-line pt-2">
            <span className="font-extrabold">{t("checkout.total")}</span>
            <Price value={order.total} className="font-extrabold text-brand" />
          </div>
        </BentoPanel>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 font-display text-lg font-extrabold text-ink">
          {t("admin.products.title")}
        </h2>
        <ul className="divide-y-2 divide-line rounded-2xl border-2 border-line bg-panel">
          {order.order_items?.map((item) => (
            <li key={item.id} className="flex items-center gap-3 p-4">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-panel-2">
                {item.image_url && (
                  <SmartImage
                    src={item.image_url}
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
                  {lang === "ar" ? item.name_ar : item.name_fr}
                </p>
                {(item.color || item.size || item.variants.length > 0) && (
                  <p className="text-xs text-muted">
                    {[item.color, item.size, ...variantSummary(item.variants, lang)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                <p className="text-xs text-muted">
                  {t("product.quantity")}: {item.quantity}
                </p>
              </div>
              <Price value={item.price * item.quantity} className="text-sm font-extrabold" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
