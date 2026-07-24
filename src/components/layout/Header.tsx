import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronDown, Menu, Moon, Search, Sun, X } from "lucide-react";
import { Logo } from "./Logo";
import { ShoppingBagIcon } from "@/components/icons/ShoppingBagIcon";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useTheme } from "@/theme/ThemeProvider";
import { useCartStore } from "@/store/cart";
import { useCategories } from "@/hooks/useCategories";
import { buildCategoryTree, type CategoryNode } from "@/lib/categories";
import { localize } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Lang } from "@/types/db";

const LINK_TONES = [
  "hover:text-brand",
  "hover:text-blue",
  "hover:text-green",
  "hover:text-brand",
  "hover:text-blue",
  "hover:text-green",
] as const;

function NavLinkItem({
  to,
  tone,
  children,
  onClick,
}: {
  to: string;
  tone: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn("group relative text-base font-bold text-ink transition-colors", tone)}
    >
      {children}
      <span
        aria-hidden
        className="absolute -bottom-1 start-0 h-0.5 w-full origin-left scale-x-0 rounded-full bg-current transition-transform duration-200 group-hover:scale-x-100"
      />
    </Link>
  );
}

/** Desktop nav item: plain link, or a hover mega-menu when the category has subcategories. */
function CategoryNavItem({
  category,
  tone,
  lang,
}: {
  category: CategoryNode;
  tone: string;
  lang: Lang;
}) {
  const [open, setOpen] = useState(false);
  const hasChildren = category.children.length > 0;

  return (
    <div
      className="relative"
      onMouseEnter={() => hasChildren && setOpen(true)}
      onMouseLeave={() => hasChildren && setOpen(false)}
    >
      <NavLinkItem to={`/shop?categories=${category.slug}`} tone={tone}>
        <span className="inline-flex items-center gap-1">
          {localize(category, "name", lang)}
          {hasChildren && <ChevronDown className="h-3.5 w-3.5" />}
        </span>
      </NavLinkItem>

      {hasChildren && open && (
        <div className="absolute start-0 top-full z-40 mt-3 flex gap-8 rounded-2xl border-2 border-line bg-panel p-6 shadow-2xl">
          {category.children.map((group) => (
            <div key={group.id} className="min-w-[160px]">
              <Link
                to={`/shop?categories=${group.slug}`}
                className="mb-3 block text-xs font-extrabold uppercase tracking-wide text-muted transition-colors hover:text-brand"
              >
                {localize(group, "name", lang)}
              </Link>
              {group.children.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {group.children.map((leaf) => (
                    <li key={leaf.id}>
                      <Link
                        to={`/shop?categories=${leaf.slug}`}
                        className="text-sm font-bold text-ink transition-colors hover:text-brand"
                      >
                        {localize(leaf, "name", lang)}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Mobile nav item: plain link, or an accordion disclosure when the category has subcategories. */
function CategoryMobileItem({
  category,
  tone,
  lang,
  onNavigate,
}: {
  category: CategoryNode;
  tone: string;
  lang: Lang;
  onNavigate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = category.children.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between">
        <NavLinkItem to={`/shop?categories=${category.slug}`} tone={tone} onClick={onNavigate}>
          {localize(category, "name", lang)}
        </NavLinkItem>
        {hasChildren && (
          <button
            onClick={() => setExpanded((v) => !v)}
            aria-label={localize(category, "name", lang)}
            className="rounded-full p-1.5 text-muted transition-transform hover:bg-panel-2"
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
          </button>
        )}
      </div>

      {hasChildren && expanded && (
        <div className="ms-3 mt-2 flex flex-col gap-3 border-s-2 border-line ps-3">
          {category.children.map((group) => (
            <div key={group.id}>
              <Link
                to={`/shop?categories=${group.slug}`}
                onClick={onNavigate}
                className="text-xs font-extrabold uppercase tracking-wide text-muted"
              >
                {localize(group, "name", lang)}
              </Link>
              {group.children.length > 0 && (
                <ul className="mt-1.5 flex flex-col gap-1.5">
                  {group.children.map((leaf) => (
                    <li key={leaf.id}>
                      <Link
                        to={`/shop?categories=${leaf.slug}`}
                        onClick={onNavigate}
                        className="text-sm font-semibold text-ink"
                      >
                        {localize(leaf, "name", lang)}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { t, lang, setLang, dir } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { data: categories } = useCategories();
  const openCart = useCartStore((s) => s.openCart);
  const totalCount = useCartStore((s) => s.totalCount());
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const topLevel = categories ? buildCategoryTree(categories) : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/shop?q=${encodeURIComponent(searchValue.trim())}`);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 border-b-2 border-line bg-panel/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Logo />

        <nav className="ms-4 hidden items-center gap-6 lg:ms-10 lg:flex">
          <NavLinkItem to="/" tone={LINK_TONES[0]}>
            {t("nav.home")}
          </NavLinkItem>
          <NavLinkItem to="/shop" tone={LINK_TONES[1]}>
            {t("nav.shop")}
          </NavLinkItem>
          {topLevel.slice(0, 4).map((cat, i) => (
            <CategoryNavItem
              key={cat.id}
              category={cat}
              tone={LINK_TONES[(i + 2) % LINK_TONES.length]}
              lang={lang}
            />
          ))}
        </nav>

        <form onSubmit={handleSearch} className="ms-auto hidden max-w-xs flex-1 md:block">
          <div className="relative">
            <input
              type="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={t("nav.search")}
              className="w-full rounded-full border-2 border-line bg-panel-2 py-2 ps-4 pe-10 text-sm text-ink placeholder:text-muted transition-colors hover:border-yellow focus:border-blue focus:outline-none"
            />
            <button
              type="submit"
              aria-label={t("shop.filter.search")}
              className="absolute end-1 top-1/2 -translate-y-1/2 rounded-full bg-blue/10 p-1.5 text-blue transition-colors hover:bg-blue hover:text-blue-ink"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </form>

        <div className={cn("ms-auto flex items-center gap-1.5", "md:ms-2")}>
          <button
            onClick={() => setLang(lang === "fr" ? "ar" : "fr")}
            className="rounded-full border-2 border-green/40 bg-green/10 px-2.5 py-1 text-xs font-extrabold text-green transition-all hover:-rotate-3 hover:bg-green hover:text-green-ink"
            aria-label={t("common.language")}
          >
            {lang === "fr" ? "AR" : "FR"}
          </button>
          <button
            onClick={toggleTheme}
            className="hover-wiggle rounded-full p-2 text-ink transition-colors hover:bg-yellow/25 hover:text-yellow"
            aria-label={t("common.theme")}
          >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
          <button
            onClick={openCart}
            className="relative rounded-full p-2 text-ink transition-all hover:-rotate-6 hover:bg-brand/10 hover:text-brand"
            aria-label={t("nav.cart")}
          >
            <ShoppingBagIcon className="h-5 w-5" />
            {totalCount > 0 && (
              <motion.span
                key={totalCount}
                initial={{ scale: 0.4 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 18 }}
                className="absolute -end-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-ink"
              >
                {totalCount}
              </motion.span>
            )}
          </button>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-full p-2 text-ink transition-colors hover:bg-blue/10 hover:text-blue lg:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t-2 border-line bg-panel px-4 py-4 lg:hidden" dir={dir}>
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <input
                type="search"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={t("nav.search")}
                className="w-full rounded-full border-2 border-line bg-panel-2 py-2 ps-4 pe-10 text-sm text-ink placeholder:text-muted focus:border-blue focus:outline-none"
              />
              <button
                type="submit"
                aria-label={t("shop.filter.search")}
                className="absolute end-1 top-1/2 -translate-y-1/2 rounded-full bg-blue/10 p-1.5 text-blue"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>
          <nav className="flex flex-col gap-3">
            <NavLinkItem to="/" tone={LINK_TONES[0]} onClick={() => setMobileOpen(false)}>
              {t("nav.home")}
            </NavLinkItem>
            <NavLinkItem to="/shop" tone={LINK_TONES[1]} onClick={() => setMobileOpen(false)}>
              {t("nav.shop")}
            </NavLinkItem>
            {topLevel.map((cat, i) => (
              <CategoryMobileItem
                key={cat.id}
                category={cat}
                tone={LINK_TONES[(i + 2) % LINK_TONES.length]}
                lang={lang}
                onNavigate={() => setMobileOpen(false)}
              />
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
