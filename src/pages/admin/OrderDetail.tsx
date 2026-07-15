import { useParams } from "react-router-dom";
import { useAdminOrder, useUpdateOrderStatus } from "@/hooks/useOrders";
import { Select } from "@/components/ui/Select";
import { BentoPanel } from "@/components/ui/BentoPanel";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatDate, formatPrice } from "@/lib/format";
import type { OrderStatus } from "@/types/db";

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useLanguage();
  const { data: order, isLoading } = useAdminOrder(id);
  const updateStatus = useUpdateOrderStatus();

  if (isLoading || !order) {
    return <p className="text-muted">{t("common.loading")}</p>;
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
            updateStatus.mutate({ id: order.id, status: e.target.value as OrderStatus })
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
            <span className="font-bold">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">{t("checkout.shipping")}</span>
            <span className="font-bold">{formatPrice(order.shipping)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t-2 border-line pt-2">
            <span className="font-extrabold">{t("checkout.total")}</span>
            <span className="font-extrabold text-brand">{formatPrice(order.total)}</span>
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
                  <img
                    src={item.image_url}
                    alt=""
                    width={56}
                    height={56}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-ink">
                  {lang === "ar" ? item.name_ar : item.name_fr}
                </p>
                {(item.color || item.size) && (
                  <p className="text-xs text-muted">
                    {[item.color, item.size].filter(Boolean).join(" · ")}
                  </p>
                )}
                <p className="text-xs text-muted">
                  {t("product.quantity")}: {item.quantity}
                </p>
              </div>
              <span className="text-sm font-extrabold">{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
