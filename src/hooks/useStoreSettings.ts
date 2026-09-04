import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { DeliveryType, StoreSettings } from "@/types/db";

const STORE_SETTINGS_FALLBACK: StoreSettings = {
  id: 1,
  shipping_fee: 500,
  free_ship_threshold: null,
  updated_at: new Date(0).toISOString(),
};

export function useStoreSettings() {
  return useQuery({
    queryKey: ["store-settings"],
    queryFn: async (): Promise<StoreSettings> => {
      // .maybeSingle() (not .single()) — .single() throws on 0 rows and would
      // white-screen checkout if the seed row were ever missing. Degrade to a
      // safe default (free shipping OFF) instead; the RPC is the real source
      // of truth for what gets charged.
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return (data as StoreSettings) ?? STORE_SETTINGS_FALLBACK;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateStoreSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Pick<StoreSettings, "shipping_fee" | "free_ship_threshold">>) => {
      const { error } = await supabase.from("store_settings").update(patch).eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["store-settings"] }),
  });
}

export function useDeliveryPrices() {
  return useQuery({
    queryKey: ["delivery-prices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_prices")
        .select("*")
        .order("wilaya", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Single source of shipping truth, shared by Checkout.tsx and
 * InlineCheckout.tsx, mirroring exactly what the place_order RPC computes
 * server-side. Returns null when no wilaya fee is known yet (render "—",
 * not 0 — an unknown amount must never look identical to a genuinely free
 * shipping line).
 */
export function resolveShipping(
  wilayaFee: number | null | undefined,
  goodsSubtotal: number,
  settings: StoreSettings | undefined,
): number | null {
  if (wilayaFee == null || !settings) return null;
  if (settings.free_ship_threshold != null && goodsSubtotal >= settings.free_ship_threshold) {
    return 0;
  }
  return wilayaFee;
}

export function wilayaFeeFor(
  deliveryPrices: Array<{ wilaya: string; home_price: number; office_price: number; active: boolean }>,
  wilaya: string | undefined,
  deliveryType: DeliveryType,
): number | null {
  if (!wilaya) return null;
  const row = deliveryPrices.find((d) => d.wilaya === wilaya && d.active);
  if (!row) return null;
  return deliveryType === "home" ? row.home_price : row.office_price;
}
