import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { sanitizeSearchTerm } from "@/lib/utils";
import type { Product } from "@/types/db";

const PRODUCT_SELECT = "*, product_images(*), categories(*)";

// A DB that hasn't run the variants/offers migration yet returns rows
// without those columns — normalize once here so every consumer can trust
// the arrays instead of crashing on `product.variants.map(...)`.
function normalizeProduct(product: Product): Product {
  return {
    ...product,
    variants: product.variants ?? [],
    quantity_offers: product.quantity_offers ?? [],
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
  categorySlug?: string | null;
  search?: string;
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

      if (filters.categorySlug) {
        const { data: category } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", filters.categorySlug)
          .maybeSingle();
        if (category) {
          query = query.eq("category_id", category.id);
        } else {
          return [];
        }
      }

      if (filters.search && filters.search.trim().length > 0) {
        const term = sanitizeSearchTerm(filters.search.trim());
        query = query.or(`name_fr.ilike.%${term}%,name_ar.ilike.%${term}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return ((data as Product[]) ?? []).map(normalizeProduct);
    },
    staleTime: 30 * 1000,
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
