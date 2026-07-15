import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Moon, Search, ShoppingBag, Sun, X } from "lucide-react";
import { Logo } from "./Logo";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useTheme } from "@/theme/ThemeProvider";
import { useCartStore } from "@/store/cart";
import { useCategories } from "@/hooks/useCategories";
import { localize } from "@/lib/format";
import { cn } from "@/lib/utils";

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
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-6 lg:flex">
          <Link to="/" className="text-sm font-bold text-ink transition-colors hover:text-brand">
            {t("nav.home")}
          </Link>
          <Link
            to="/shop"
            className="text-sm font-bold text-ink transition-colors hover:text-brand"
          >
            {t("nav.shop")}
          </Link>
          {categories?.slice(0, 4).map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className="text-sm font-bold text-ink transition-colors hover:text-brand"
            >
              {localize(cat, "name", lang)}
            </Link>
          ))}
        </nav>

        <form onSubmit={handleSearch} className="ms-auto hidden max-w-xs flex-1 md:block">
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
              className="absolute end-1 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted hover:text-blue"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </form>

        <div className={cn("flex items-center gap-1.5", "md:ms-2")}>
          <button
            onClick={() => setLang(lang === "fr" ? "ar" : "fr")}
            className="rounded-full px-2.5 py-1.5 text-xs font-bold text-ink transition-colors hover:bg-panel-2"
            aria-label={t("common.language")}
          >
            {lang === "fr" ? "AR" : "FR"}
          </button>
          <button
            onClick={toggleTheme}
            className="rounded-full p-2 text-ink transition-colors hover:bg-panel-2"
            aria-label={t("common.theme")}
          >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
          <button
            onClick={openCart}
            className="relative rounded-full p-2 text-ink transition-colors hover:bg-panel-2"
            aria-label={t("nav.cart")}
          >
            <ShoppingBag className="h-5 w-5" />
            {totalCount > 0 && (
              <span className="absolute -end-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-ink">
                {totalCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-full p-2 text-ink transition-colors hover:bg-panel-2 lg:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="border-t-2 border-line bg-panel px-4 py-4 lg:hidden"
          dir={dir}
        >
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
                className="absolute end-1 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>
          <nav className="flex flex-col gap-3">
            <Link to="/" onClick={() => setMobileOpen(false)} className="text-sm font-bold text-ink">
              {t("nav.home")}
            </Link>
            <Link
              to="/shop"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-bold text-ink"
            >
              {t("nav.shop")}
            </Link>
            {categories?.map((cat) => (
              <Link
                key={cat.id}
                to={`/shop?category=${cat.slug}`}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-bold text-ink"
              >
                {localize(cat, "name", lang)}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
