import type { ProductColor, VariantGroup } from "@/types/db";

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Drop half-filled groups (no name, or no usable option) and clean each
 *  option — AR falls back to FR, image normalises to null — before writing. */
export function sanitizeVariantGroups(groups: VariantGroup[]): VariantGroup[] {
  return groups
    .map((g) => ({
      name_fr: g.name_fr.trim(),
      name_ar: g.name_ar.trim() || g.name_fr.trim(),
      values: g.values
        .filter((o) => o.value_fr.trim())
        .map((o) => ({
          value_fr: o.value_fr.trim(),
          value_ar: o.value_ar.trim() || o.value_fr.trim(),
          image_url: o.image_url || null,
        })),
    }))
    .filter((g) => g.name_fr && g.values.length > 0);
}

/** Drop colour rows the admin never named, and normalize a missing hex —
 *  never write a nameless swatch or invalid hex to the storefront. */
export function sanitizeColors(colors: ProductColor[]): ProductColor[] {
  return colors
    .filter((c) => c.label_fr.trim())
    .map((c) => ({
      label_fr: c.label_fr.trim(),
      label_ar: c.label_ar.trim() || c.label_fr.trim(),
      hex: /^#[0-9a-fA-F]{6}$/.test(c.hex) ? c.hex : "#a1a1aa",
      image_url: c.image_url || null,
    }));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function uniqueSlug(
  base: string,
  checkExists: (slug: string) => Promise<boolean>,
  fallback = "produit",
): Promise<string> {
  const baseSlug = slugify(base) || fallback;
  let candidate = baseSlug;
  let suffix = 2;
  while (await checkExists(candidate)) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

/**
 * Strip PostgREST filter-grammar characters (,()) and backslash-escape
 * ILIKE wildcards (%_) before interpolating user search input into a
 * `.or()` filter string — otherwise a search term can inject additional
 * filter clauses or trigger unanchored wildcard scans.
 */
export function sanitizeSearchTerm(term: string): string {
  return term
    .replace(/[,()]/g, "")
    .replace(/[\\%_]/g, "\\$&")
    .slice(0, 100);
}
