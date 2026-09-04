import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Package, Receipt, TrendingUp, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { BentoPanel } from "@/components/ui/BentoPanel";
import { Price } from "@/components/ui/Price";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatDate } from "@/lib/format";
import type { Order } from "@/types/db";

interface OrderStats {
  total_orders: number;
  pending_orders: number;
  active_products: number;
  revenue: number;
}

function useDashboardStats() {
  return useQuery({
    queryKey: ["admin", "dashboard-stats"],
    queryFn: async () => {
      // KPI cards from a SECURITY DEFINER aggregate — never sum every order
      // row in the browser (unbounded as the store grows).
      const [{ data: stats, error: statsError }, { data: recentOrders, error: recentError }] =
        await Promise.all([
          supabase.rpc("get_admin_order_stats"),
          supabase
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5),
        ]);
      if (statsError) throw statsError;
      if (recentError) throw recentError;

      const s = (stats as OrderStats | null) ?? {
        total_orders: 0,
        pending_orders: 0,
        active_products: 0,
        revenue: 0,
      };

      return {
        totalOrders: s.total_orders,
        pendingOrders: s.pending_orders,
        activeProducts: s.active_products,
        revenue: Number(s.revenue),
        recentOrders: (recentOrders as Order[]) ?? [],
      };
    },
  });
}

export default function Dashboard() {
  const { t, lang } = useLanguage();
  const { data, isLoading } = useDashboardStats();

  const cards = [
    { key: "admin.dashboard.totalOrders", value: data?.totalOrders, Icon: Receipt, accent: "blue", isPrice: false },
    { key: "admin.dashboard.pendingOrders", value: data?.pendingOrders, Icon: Clock, accent: "yellow", isPrice: false },
    { key: "admin.dashboard.products", value: data?.activeProducts, Icon: Package, accent: "green", isPrice: false },
    { key: "admin.dashboard.revenue", value: data?.revenue, Icon: TrendingUp, accent: "brand", isPrice: true },
  ] as const;

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-ink">{t("admin.dashboard.title")}</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ key, value, Icon, accent, isPrice }) => (
          <BentoPanel key={key} accent={accent}>
            <Icon className="h-6 w-6 text-muted" />
            <p className="mt-3 text-2xl font-extrabold text-ink">
              {isLoading ? "…" : isPrice ? <Price value={value ?? 0} /> : (value ?? 0)}
            </p>
            <p className="mt-1 text-sm text-muted">{t(key)}</p>
          </BentoPanel>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="mb-3 font-display text-lg font-extrabold text-ink">
          {t("admin.dashboard.recentOrders")}
        </h2>
        <div className="overflow-x-auto rounded-2xl border-2 border-line bg-panel">
          <table className="w-full min-w-[560px] text-start text-sm">
            <thead>
              <tr className="border-b-2 border-line text-start text-muted">
                <th className="px-4 py-3 text-start font-bold">{t("admin.orders.number")}</th>
                <th className="px-4 py-3 text-start font-bold">{t("admin.orders.customer")}</th>
                <th className="px-4 py-3 text-start font-bold">{t("admin.orders.total")}</th>
                <th className="px-4 py-3 text-start font-bold">{t("admin.orders.status")}</th>
                <th className="px-4 py-3 text-start font-bold">{t("admin.orders.date")}</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link to={`/admin/orders/${order.id}`} className="text-blue hover:underline">
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{order.customer_name}</td>
                  <td className="px-4 py-3 font-bold">
                    <Price value={order.total} />
                  </td>
                  <td className="px-4 py-3">{t(`admin.orders.status.${order.status}`)}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(order.created_at, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
