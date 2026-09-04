import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useDeliveryPrices } from "@/hooks/useStoreSettings";
import { useAdminToast } from "@/components/admin/AdminToast";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import type { DeliveryPrice } from "@/types/db";

export default function AdminDeliveryPrices() {
  const { t } = useLanguage();
  const { toast } = useAdminToast();
  const queryClient = useQueryClient();
  const { data: deliveryPrices, isLoading } = useDeliveryPrices();
  const [rows, setRows] = useState<DeliveryPrice[]>([]);

  useEffect(() => {
    if (deliveryPrices) setRows(deliveryPrices as DeliveryPrice[]);
  }, [deliveryPrices]);

  const updateMutation = useMutation({
    mutationFn: async (row: DeliveryPrice) => {
      const { error } = await supabase
        .from("delivery_prices")
        .update({
          home_price: row.home_price,
          office_price: row.office_price,
          active: row.active,
        })
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast(t("admin.saved"));
      queryClient.invalidateQueries({ queryKey: ["delivery-prices"] });
    },
    onError: () => {
      // Refused write — restore the on-screen values from server state so a
      // rejected price doesn't sit there looking saved.
      if (deliveryPrices) setRows(deliveryPrices as DeliveryPrice[]);
      toast(t("admin.saveError"), "error");
    },
  });

  const handleChange = (id: string, patch: Partial<DeliveryPrice>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const handleBlurSave = (id: string) => {
    const row = rows.find((r) => r.id === id);
    if (row) updateMutation.mutate(row);
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-ink">{t("admin.delivery.title")}</h1>

      <div className="mt-6 overflow-x-auto rounded-2xl border-2 border-line bg-panel">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b-2 border-line text-muted">
              <th className="px-4 py-3 text-start font-bold">{t("admin.delivery.wilaya")}</th>
              <th className="w-32 px-4 py-3 text-start font-bold">{t("admin.delivery.home")}</th>
              <th className="w-32 px-4 py-3 text-start font-bold">{t("admin.delivery.office")}</th>
              <th className="w-20 px-4 py-3 text-start font-bold">{t("admin.delivery.active")}</th>
            </tr>
          </thead>
          <tbody>
            {!isLoading &&
              rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn("border-b border-line last:border-0", !row.active && "opacity-40")}
                >
                  <td className="px-4 py-3 font-bold text-ink">{row.wilaya}</td>
                  <td className="w-32 px-4 py-3">
                    <input
                      type="number"
                      min={0}
                      value={row.home_price}
                      onChange={(e) => handleChange(row.id, { home_price: Number(e.target.value) })}
                      onBlur={() => handleBlurSave(row.id)}
                      className="w-full rounded-lg border-2 border-line bg-panel px-2 py-1.5 text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </td>
                  <td className="w-32 px-4 py-3">
                    <input
                      type="number"
                      min={0}
                      value={row.office_price}
                      onChange={(e) => handleChange(row.id, { office_price: Number(e.target.value) })}
                      onBlur={() => handleBlurSave(row.id)}
                      className="w-full rounded-lg border-2 border-line bg-panel px-2 py-1.5 text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </td>
                  <td className="w-20 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={row.active}
                      onChange={(e) => {
                        handleChange(row.id, { active: e.target.checked });
                        updateMutation.mutate({ ...row, active: e.target.checked });
                      }}
                      className="h-5 w-5"
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
