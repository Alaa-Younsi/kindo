import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { CatMascot } from "@/components/effects/mascots";
import { Paw } from "@/components/effects/PawScatter";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { useSeo } from "@/hooks/useSeo";
import { localize } from "@/lib/format";
import { cn } from "@/lib/utils";

const CHIP_TONES = [
  "border-brand/40 text-brand hover:bg-brand/10 data-[active=true]:bg-brand data-[active=true]:text-brand-ink data-[active=true]:border-brand",
  "border-blue/40 text-blue hover:bg-blue/10 data-[active=true]:bg-blue data-[active=true]:text-blue-ink data-[active=true]:border-blue",
  "border-green/40 text-green hover:bg-green/10 data-[active=true]:bg-green data-[active=true]:text-green-ink data-[active=true]:border-green",
  "border-yellow/60 text-yellow hover:bg-yellow/20 data-[active=true]:bg-yellow data-[active=true]:text-yellow-ink data-[active=true]:border-yellow",
] as const;

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-3xl border-2 border-line bg-panel">
      <div className="skeleton aspect-square" />
      <div className="flex flex-col gap-2 p-4">
        <div className="skeleton h-4 w-3/4 rounded-full" />
        <div className="skeleton h-5 w-1/3 rounded-full" />
      </div>
    </div>
  );
}

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
    <div className="bg-tint-blue">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="squiggle inline-block font-display text-3xl font-extrabold text-ink">
          {t("shop.title")}
        </h1>

        <form onSubmit={handleSearchSubmit} className="mt-6 max-w-xl">
          <div className="relative">
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("nav.search")}
              className="w-full rounded-full border-2 border-line bg-panel py-2.5 ps-5 pe-12 text-ink placeholder:text-muted transition-colors hover:border-yellow focus:border-blue focus:outline-none"
            />
            <button
              type="submit"
              aria-label={t("shop.filter.search")}
              className="absolute end-1.5 top-1/2 -translate-y-1/2 rounded-full bg-blue p-2 text-blue-ink transition-transform hover:rotate-12"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </form>

        {/* Category chips */}
        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
          <button
            data-active={categorySlug === ""}
            onClick={() => handleCategoryChange("")}
            className="shrink-0 rounded-full border-2 border-line bg-panel px-4 py-1.5 text-sm font-extrabold text-ink transition-all hover:-translate-y-0.5 data-[active=true]:border-ink data-[active=true]:bg-ink data-[active=true]:text-bg"
          >
            {t("shop.filter.all")}
          </button>
          {categories?.map((cat, i) => (
            <button
              key={cat.id}
              data-active={categorySlug === cat.slug}
              onClick={() => handleCategoryChange(cat.slug)}
              className={cn(
                "shrink-0 rounded-full border-2 bg-panel px-4 py-1.5 text-sm font-extrabold transition-all hover:-translate-y-0.5",
                CHIP_TONES[i % CHIP_TONES.length],
              )}
            >
              {localize(cat, "name", lang)}
            </button>
          ))}
        </div>

        <p className="mt-4 flex items-center gap-2 text-sm font-bold text-muted">
          <Paw className="h-4 w-4 text-brand/50" />
          {isLoading ? t("common.loading") : `${products?.length ?? 0} ${t("shop.results")}`}
        </p>

        {isLoading ? (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : products && products.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <span className="flex h-36 w-36 items-center justify-center rounded-full bg-yellow/15">
              <CatMascot className="h-28 w-28" />
            </span>
            <p className="font-bold text-muted">{t("shop.empty")}</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {products?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
