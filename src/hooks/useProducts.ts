import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { sanitizeSearchTerm } from "@/lib/utils";
import type { Product, ProductColor } from "@/types/db";

const PRODUCT_SELECT = "*, product_images(*), categories(*)";

// Older rows (pre-object-colors) stored `colors` as plain strings — lift
// those into the { label_fr, label_ar, hex } shape so every consumer can
// trust the object form instead of crashing on `color.hex`.
function normalizeColors(colors: unknown): ProductColor[] {
  if (!Array.isArray(colors)) return [];
  return colors.map((c) =>
    typeof c === "string" ? { label_fr: c, label_ar: c, hex: "#a1a1aa" } : (c as ProductColor),
  );
}

// A DB that hasn't run the variants/offers migration yet returns rows
// without those columns — normalize once here so every consumer can trust
// the arrays instead of crashing on `product.variants.map(...)`.
function normalizeProduct(product: Product): Product {
  return {
    ...product,
    variants: product.variants ?? [],
    quantity_offers: product.quantity_offers ?? [],
    colors: normalizeColors(product.colors),
  };
}

export function useFeaturedProducts(limit = 8) {
  return useQuery({
    queryKey: ["products", "featured", limit],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("status", "active")
        .eq("featured", true)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return ((data as Product[]) ?? []).map(normalizeProduct);
    },
    staleTime: 60 * 1000,
  });
}

export interface ProductFilters {
  categorySlugs?: string[];
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ["products", "shop", filters],
    queryFn: async (): Promise<Product[]> => {
      let query = supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (filters.categorySlugs && filters.categorySlugs.length > 0) {
        const { data: cats } = await supabase
          .from("categories")
          .select("id")
          .in("slug", filters.categorySlugs);
        const ids = (cats ?? []).map((c) => c.id);
        if (ids.length === 0) return [];
        query = query.in("category_id", ids);
      }

      if (filters.search && filters.search.trim().length > 0) {
        const term = sanitizeSearchTerm(filters.search.trim());
        query = query.or(`name_fr.ilike.%${term}%,name_ar.ilike.%${term}%`);
      }

      if (filters.minPrice != null) query = query.gte("price", filters.minPrice);
      if (filters.maxPrice != null) query = query.lte("price", filters.maxPrice);

      const { data, error } = await query;
      if (error) throw error;
      return ((data as Product[]) ?? []).map(normalizeProduct);
    },
    staleTime: 30 * 1000,
  });
}

/** Min/max active price, used to seed the shop price-range filter bounds. */
export function usePriceBounds() {
  return useQuery({
    queryKey: ["products", "price-bounds"],
    queryFn: async (): Promise<{ min: number; max: number }> => {
      const [{ data: lowest }, { data: highest }] = await Promise.all([
        supabase.from("products").select("price").eq("status", "active").order("price", { ascending: true }).limit(1).maybeSingle(),
        supabase.from("products").select("price").eq("status", "active").order("price", { ascending: false }).limit(1).maybeSingle(),
      ]);
      return { min: lowest?.price ?? 0, max: highest?.price ?? 10000 };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: ["products", "detail", slug],
    queryFn: async (): Promise<Product | null> => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("slug", slug)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      return data ? normalizeProduct(data as Product) : null;
    },
    enabled: !!slug,
    staleTime: 30 * 1000,
  });
}

export function useRelatedProducts(categoryId: string | null | undefined, excludeId?: string) {
  return useQuery({
    queryKey: ["products", "related", categoryId, excludeId],
    queryFn: async (): Promise<Product[]> => {
      if (!categoryId) return [];
      let query = supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("status", "active")
        .eq("category_id", categoryId)
        .limit(4);
      if (excludeId) query = query.neq("id", excludeId);
      const { data, error } = await query;
      if (error) throw error;
      return ((data as Product[]) ?? []).map(normalizeProduct);
    },
    enabled: !!categoryId,
    staleTime: 60 * 1000,
  });
}

/** Admin: every status, not just active. */
export function useAdminProducts() {
  return useQuery({
    queryKey: ["admin", "products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data as Product[]) ?? []).map(normalizeProduct);
    },
  });
}

export function useAdminProduct(id: string | undefined) {
  return useQuery({
    queryKey: ["admin", "products", id],
    queryFn: async (): Promise<Product | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? normalizeProduct(data as Product) : null;
    },
    enabled: !!id,
  });
}
