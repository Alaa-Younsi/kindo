import { useState } from "react";
import { Link } from "react-router-dom";
import { Download, Trash2 } from "lucide-react";
import { ADMIN_ORDERS_LIMIT, useAdminOrders, useDeleteAllOrders } from "@/hooks/useOrders";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DeleteAllOrdersModal } from "@/components/admin/DeleteAllOrdersModal";
import { Price } from "@/components/ui/Price";
import { useAdminToast } from "@/components/admin/AdminToast";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatDate } from "@/lib/format";
import { exportOrdersToExcel } from "@/lib/exportOrders";
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
  const { toast } = useAdminToast();
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const { data: orders, isLoading } = useAdminOrders(status);
  const deleteAll = useDeleteAllOrders();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleExport = async () => {
    if (!orders || orders.length === 0) return;
    try {
      await exportOrdersToExcel(orders);
    } catch {
      toast(t("admin.exportError"), "error");
    }
  };

  const handleConfirmDeleteAll = async () => {
    try {
      await deleteAll.mutateAsync();
      setDeleteModalOpen(false);
      toast(t("admin.saved"));
    } catch {
      toast(t("admin.deleteError"), "error");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold text-ink">{t("admin.orders.title")}</h1>
        <div className="flex flex-wrap items-center gap-2">
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!orders || orders.length === 0}
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
            {t("admin.orders.export")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!orders || orders.length === 0}
            onClick={() => setDeleteModalOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            {t("admin.orders.deleteAll.button")}
          </Button>
        </div>
      </div>

      {orders && orders.length >= ADMIN_ORDERS_LIMIT && (
        <p className="mt-4 text-xs text-muted">
          {t("admin.orders.limitNotice").replace("{n}", String(ADMIN_ORDERS_LIMIT))}
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border-2 border-line bg-panel">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b-2 border-line text-muted">
              <th className="whitespace-nowrap px-4 py-3 text-start font-bold">{t("admin.orders.number")}</th>
              <th className="whitespace-nowrap px-4 py-3 text-start font-bold">{t("admin.orders.customer")}</th>
              <th className="whitespace-nowrap px-4 py-3 text-start font-bold">{t("admin.orders.total")}</th>
              <th className="whitespace-nowrap px-4 py-3 text-start font-bold">{t("admin.orders.status")}</th>
              <th className="whitespace-nowrap px-4 py-3 text-start font-bold">{t("admin.orders.date")}</th>
            </tr>
          </thead>
          <tbody>
            {!isLoading &&
              orders?.map((order) => (
                <tr key={order.id} className="border-b border-line last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                    <Link to={`/admin/orders/${order.id}`} className="text-blue hover:underline">
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{order.customer_name}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-bold">
                    <Price value={order.total} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Badge tone={STATUS_TONE[order.status]}>
                      {t(`admin.orders.status.${order.status}`)}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(order.created_at, lang)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <DeleteAllOrdersModal
        open={deleteModalOpen}
        count={orders?.length ?? 0}
        deleting={deleteAll.isPending}
        onClose={() => setDeleteModalOpen(false)}
        onExport={handleExport}
        onConfirm={handleConfirmDeleteAll}
      />
    </div>
  );
}
