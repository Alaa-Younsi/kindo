import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { GuestOrderLookup, Order, OrderStatus } from "@/types/db";

export interface PlaceOrderVariantPick {
  name_fr: string;
  name_ar: string;
  value: string;
}

export interface PlaceOrderItem {
  product_id: string;
  quantity: number;
  color?: string | null;
  size?: string | null;
  variants?: PlaceOrderVariantPick[];
}

export interface PlaceOrderCustomer {
  name: string;
  phone: string;
  wilaya: string;
  city: string;
  delivery_type: "home" | "office";
  language: "fr" | "ar";
}

/** Calls the place_order SECURITY DEFINER RPC — the only write path to orders. */
export function usePlaceOrder() {
  return useMutation({
    mutationFn: async ({
      items,
      customer,
    }: {
      items: PlaceOrderItem[];
      customer: PlaceOrderCustomer;
    }) => {
      const { data, error } = await supabase.rpc("place_order", {
        items,
        customer,
      });
      if (error) throw error;
      return data as string; // order_number
    },
  });
}

/** Guest-safe lookup via RPC — orders has no anon SELECT policy. */
export function useGuestOrder(orderNumber: string | undefined) {
  return useQuery({
    queryKey: ["order", "guest", orderNumber],
    queryFn: async (): Promise<GuestOrderLookup | null> => {
      if (!orderNumber) return null;
      const { data, error } = await supabase.rpc("get_order_by_number", {
        p_order_number: orderNumber,
      });
      if (error) throw error;
      return data as GuestOrderLookup | null;
    },
    enabled: !!orderNumber,
    retry: false,
  });
}

/** Admin: full order list, optionally filtered by status. */
export function useAdminOrders(status?: OrderStatus | "all") {
  return useQuery({
    queryKey: ["admin", "orders", status],
    queryFn: async (): Promise<Order[]> => {
      let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (status && status !== "all") {
        query = query.eq("status", status);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data as Order[]) ?? [];
    },
  });
}

export function useAdminOrder(id: string | undefined) {
  return useQuery({
    queryKey: ["admin", "orders", "detail", id],
    queryFn: async (): Promise<Order | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const order = data as Order;
      // A DB that hasn't run the variants migration yet returns items
      // without the column — normalize once here so every consumer can
      // trust the array.
      return {
        ...order,
        order_items: order.order_items?.map((item) => ({
          ...item,
          variants: item.variants ?? [],
        })),
      };
    },
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
  });
}

/** Deleting orders does NOT restock products — the restock trigger only
 *  fires on the cancelled transition, not on delete. Meant for wiping test
 *  orders before launch, not routine cleanup. */
export function useDeleteAllOrders() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("orders").delete().not("id", "is", null);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
  });
}
