import {
  LayoutDashboard,
  ListTree,
  Package,
  Star,
  Truck,
  Radio,
  FileText,
  Users,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import type { TranslationKey } from "@/i18n/translations";

export interface AdminSection {
  /** Must equal the has_section('…') string in 0015_admin_content.sql AND the
   *  edge function's ALLOWED_SECTIONS. A mismatch fails silently. */
  key: string;
  route: string;
  exact?: boolean;
  labelKey: TranslationKey;
  icon: LucideIcon;
  /** Visible to every active admin (no grant needed). */
  always?: boolean;
  /** Only the owner. */
  ownerOnly?: boolean;
}

export const ADMIN_SECTIONS: AdminSection[] = [
  { key: "dashboard", route: "/admin", exact: true, labelKey: "admin.nav.dashboard", icon: LayoutDashboard, always: true },
  { key: "products", route: "/admin/products", labelKey: "admin.nav.products", icon: Package },
  { key: "categories", route: "/admin/categories", labelKey: "admin.nav.categories", icon: ListTree },
  { key: "orders", route: "/admin/orders", labelKey: "admin.nav.orders", icon: Truck },
  { key: "delivery", route: "/admin/delivery-prices", labelKey: "admin.nav.delivery", icon: Truck },
  { key: "reviews", route: "/admin/reviews", labelKey: "admin.nav.reviews", icon: Star },
  { key: "pixels", route: "/admin/pixels", labelKey: "admin.nav.pixels", icon: Radio },
  { key: "policy", route: "/admin/policy", labelKey: "admin.nav.policy", icon: FileText },
  { key: "team", route: "/admin/team", labelKey: "admin.nav.team", icon: Users, ownerOnly: true },
  { key: "account", route: "/admin/account", labelKey: "admin.nav.account", icon: UserCog, always: true },
];

/** Sections the owner can tick for a worker (excludes always/ownerOnly). */
export const GRANTABLE_SECTIONS = ADMIN_SECTIONS.filter((s) => !s.always && !s.ownerOnly);

/**
 * Map a pathname to its section key. Resolve the exact `/admin` overview first,
 * then the LONGEST matching route prefix — otherwise `/admin` shadows every
 * child as a prefix and `/admin/products/new` fails to map to `products`.
 */
export function routeToSection(pathname: string): string | null {
  const exact = ADMIN_SECTIONS.find((s) => s.exact && s.route === pathname);
  if (exact) return exact.key;
  const prefixMatches = ADMIN_SECTIONS.filter(
    (s) => !s.exact && (pathname === s.route || pathname.startsWith(s.route + "/")),
  ).sort((a, b) => b.route.length - a.route.length);
  return prefixMatches[0]?.key ?? null;
}
