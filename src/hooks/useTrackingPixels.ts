import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { TrackingPixel } from "@/lib/tracking";

const SELECT = "id, provider, label, pixel_id, active, scope, match_values, events, currency, sort_order, notes";

/** Storefront: active pixels only (RLS also filters anon to active). Long
 *  staleTime + retry:0 so a project that hasn't run the migration degrades to
 *  "no pixels" instead of hammering PostgREST. */
export function useActivePixels() {
  return useQuery({
    queryKey: ["tracking-pixels", "active"],
    staleTime: 1000 * 60 * 60,
    retry: 0,
    queryFn: async (): Promise<TrackingPixel[]> => {
      const { data, error } = await supabase
        .from("tracking_pixels")
        .select(SELECT)
        .eq("active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data as TrackingPixel[]) ?? [];
    },
  });
}

export function useAllPixelsAdmin() {
  return useQuery({
    queryKey: ["admin", "tracking-pixels"],
    queryFn: async (): Promise<TrackingPixel[]> => {
      const { data, error } = await supabase
        .from("tracking_pixels")
        .select(SELECT)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as TrackingPixel[]) ?? [];
    },
  });
}

export type PixelDraft = Omit<TrackingPixel, "id"> & { id?: string };

export function useSavePixel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (draft: PixelDraft) => {
      const row = {
        provider: draft.provider,
        label: draft.label.trim(),
        pixel_id: draft.pixel_id.trim(),
        active: draft.active,
        scope: draft.scope,
        match_values: draft.match_values,
        events: draft.events,
        currency: draft.currency || "DZD",
        sort_order: draft.sort_order,
        notes: draft.notes?.trim() || null,
      };
      if (draft.id) {
        const { error } = await supabase.from("tracking_pixels").update(row).eq("id", draft.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tracking_pixels").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "tracking-pixels"] });
      qc.invalidateQueries({ queryKey: ["tracking-pixels"] });
    },
  });
}

export function useDeletePixel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tracking_pixels").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "tracking-pixels"] });
      qc.invalidateQueries({ queryKey: ["tracking-pixels"] });
    },
  });
}
