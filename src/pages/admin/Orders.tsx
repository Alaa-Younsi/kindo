import { useState } from "react";
import { Link } from "react-router-dom";
import { useAdminOrders } from "@/hooks/useOrders";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatDate, formatPrice } from "@/lib/format";
import type { OrderStatus } from "@/types/db";

const STATUS_TONE: Record<OrderStatus, "brand" | "blue" | "green" | "yellow" | "neutral"> = {
  pending: "yellow",
  confirmed: "blue",
  shipped: "blue",
  delivered: "green",
  cancelled: "neutral",
};

export default function AdminOrders() {
  const { t, lang } = useLanguage();
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const { data: orders, isLoading } = useAdminOrders(status);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-ink">{t("admin.orders.title")}</h1>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus | "all")}
          wrapperClassName="w-48"
        >
          <option value="all">{t("shop.filter.all")}</option>
          <option value="pending">{t("admin.orders.status.pending")}</option>
          <option value="confirmed">{t("admin.orders.status.confirmed")}</option>
          <option value="shipped">{t("admin.orders.status.shipped")}</option>
          <option value="delivered">{t("admin.orders.status.delivered")}</option>
          <option value="cancelled">{t("admin.orders.status.cancelled")}</option>
        </Select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border-2 border-line bg-panel">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b-2 border-line text-muted">
              <th className="px-4 py-3 text-start font-bold">{t("admin.orders.number")}</th>
              <th className="px-4 py-3 text-start font-bold">{t("admin.orders.customer")}</th>
              <th className="px-4 py-3 text-start font-bold">{t("admin.orders.total")}</th>
              <th className="px-4 py-3 text-start font-bold">{t("admin.orders.status")}</th>
              <th className="px-4 py-3 text-start font-bold">{t("admin.orders.date")}</th>
            </tr>
          </thead>
          <tbody>
            {!isLoading &&
              orders?.map((order) => (
                <tr key={order.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link to={`/admin/orders/${order.id}`} className="text-blue hover:underline">
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{order.customer_name}</td>
                  <td className="px-4 py-3 font-bold">{formatPrice(order.total)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[order.status]}>
                      {t(`admin.orders.status.${order.status}`)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(order.created_at, lang)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
