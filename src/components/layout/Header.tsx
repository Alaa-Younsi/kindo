import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, Moon, Search, ShoppingBag, Sun, X } from "lucide-react";
import { Logo } from "./Logo";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useTheme } from "@/theme/ThemeProvider";
import { useCartStore } from "@/store/cart";
import { useCategories } from "@/hooks/useCategories";
import { localize } from "@/lib/format";
import { cn } from "@/lib/utils";

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
      className={cn("group relative text-sm font-bold text-ink transition-colors", tone)}
    >
      {children}
      <span
        aria-hidden
        className="absolute -bottom-1 start-0 h-0.5 w-full origin-left scale-x-0 rounded-full bg-current transition-transform duration-200 group-hover:scale-x-100"
      />
    </Link>
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/shop?q=${encodeURIComponent(searchValue.trim())}`);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 border-b-2 border-line bg-panel/95 backdrop-blur">
      {/* rainbow brand stripe */}
      <div
        aria-hidden
        className="h-1.5 bg-[linear-gradient(90deg,rgb(var(--c-brand)),rgb(var(--c-yellow)),rgb(var(--c-green)),rgb(var(--c-blue)))]"
      />
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-6 lg:flex">
          <NavLinkItem to="/" tone={LINK_TONES[0]}>
            {t("nav.home")}
          </NavLinkItem>
          <NavLinkItem to="/shop" tone={LINK_TONES[1]}>
            {t("nav.shop")}
          </NavLinkItem>
          {categories?.slice(0, 4).map((cat, i) => (
            <NavLinkItem key={cat.id} to={`/shop?category=${cat.slug}`} tone={LINK_TONES[(i + 2) % LINK_TONES.length]}>
              {localize(cat, "name", lang)}
            </NavLinkItem>
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

        <div className={cn("flex items-center gap-1.5", "md:ms-2")}>
          <button
            onClick={() => setLang(lang === "fr" ? "ar" : "fr")}
            className="rounded-full border-2 border-green/40 bg-green/10 px-2.5 py-1 text-xs font-extrabold text-green transition-all hover:-rotate-3 hover:bg-green hover:text-green-ink"
            aria-label={t("common.language")}
          >
            {lang === "fr" ? "AR" : "FR"}
          </button>
          <button
            onClick={toggleTheme}
            className="hover-wiggle rounded-full p-2 text-ink transition-colors hover:bg-yellow/25 hover:text-yellow-ink"
            aria-label={t("common.theme")}
          >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
          <button
            onClick={openCart}
            className="relative rounded-full p-2 text-ink transition-all hover:-rotate-6 hover:bg-brand/10 hover:text-brand"
            aria-label={t("nav.cart")}
          >
            <ShoppingBag className="h-5 w-5" />
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
            {categories?.map((cat, i) => (
              <NavLinkItem
                key={cat.id}
                to={`/shop?category=${cat.slug}`}
                tone={LINK_TONES[(i + 2) % LINK_TONES.length]}
                onClick={() => setMobileOpen(false)}
              >
                {localize(cat, "name", lang)}
              </NavLinkItem>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
