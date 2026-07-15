import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { Select } from "@/components/ui/Select";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { useSeo } from "@/hooks/useSeo";
import { localize } from "@/lib/format";

export default function Shop() {
  const { t, lang } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = searchParams.get("category") ?? "";
  const initialQuery = searchParams.get("q") ?? "";
  const [searchInput, setSearchInput] = useState(initialQuery);

  const { data: categories } = useCategories();
  const { data: products, isLoading } = useProducts({
    categorySlug: categorySlug || null,
    search: initialQuery,
  });

  useSeo({
    title: t("shop.title"),
    description: t("hero.subtitle"),
  });

  const handleCategoryChange = (slug: string) => {
    const next = new URLSearchParams(searchParams);
    if (slug) next.set("category", slug);
    else next.delete("category");
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchInput.trim()) next.set("q", searchInput.trim());
    else next.delete("q");
    setSearchParams(next);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-extrabold text-ink">{t("shop.title")}</h1>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative">
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("nav.search")}
              className="w-full rounded-xl border-2 border-line bg-panel py-2.5 ps-4 pe-11 text-ink placeholder:text-muted focus:border-blue focus:outline-none"
            />
            <button
              type="submit"
              aria-label={t("shop.filter.search")}
              className="absolute end-1.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted hover:text-blue"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </form>
        <Select
          value={categorySlug}
          onChange={(e) => handleCategoryChange(e.target.value)}
          wrapperClassName="sm:w-56"
        >
          <option value="">{t("shop.filter.all")}</option>
          {categories?.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {localize(cat, "name", lang)}
            </option>
          ))}
        </Select>
      </div>

      <p className="mt-4 text-sm text-muted">
        {isLoading ? t("common.loading") : `${products?.length ?? 0} ${t("shop.results")}`}
      </p>

      {!isLoading && products && products.length === 0 ? (
        <p className="py-16 text-center text-muted">{t("shop.empty")}</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products?.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
