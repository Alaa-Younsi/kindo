import type { VariantGroup } from "@/types/db";

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** A half-filled variant group the admin abandoned must not reach the
 *  storefront as a nameless/empty picker — filter before writing. */
export function sanitizeVariantGroups(groups: VariantGroup[]): VariantGroup[] {
  return groups.filter((g) => g.name_fr.trim() && g.values.length > 0);
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
