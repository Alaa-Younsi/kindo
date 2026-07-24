import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { ShopFilters } from "@/components/shop/ShopFilters";
import { Drawer } from "@/components/ui/Drawer";
import { CatMascot } from "@/components/effects/mascots";
import { Paw } from "@/components/effects/PawScatter";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCategories } from "@/hooks/useCategories";
import { topLevelCategories } from "@/lib/categories";
import { useProducts, usePriceBounds } from "@/hooks/useProducts";
import { useSeo } from "@/hooks/useSeo";
import { localize } from "@/lib/format";
import { cn } from "@/lib/utils";

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
  const categoriesParam = searchParams.get("categories") ?? "";
  const selectedSlugs = categoriesParam ? categoriesParam.split(",").filter(Boolean) : [];
  const initialQuery = searchParams.get("q") ?? "";
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: allCategories } = useCategories();
  const categories = allCategories ? topLevelCategories(allCategories) : allCategories;
  const { data: priceBounds } = usePriceBounds();
  const bounds = priceBounds ?? { min: 0, max: 10000 };

  const minPriceParam = searchParams.get("minPrice");
  const maxPriceParam = searchParams.get("maxPrice");
  const [priceValue, setPriceValue] = useState<[number, number]>([
    minPriceParam ? Number(minPriceParam) : bounds.min,
    maxPriceParam ? Number(maxPriceParam) : bounds.max,
  ]);

  // Seed the slider from real bounds once they load, unless the URL already pins a range.
  useEffect(() => {
    if (!priceBounds || minPriceParam || maxPriceParam) return;
    setPriceValue([priceBounds.min, priceBounds.max]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceBounds]);

  // Debounce writing the slider's live value into the URL so dragging doesn't refetch every pixel.
  useEffect(() => {
    const handle = setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (priceValue[0] <= bounds.min && priceValue[1] >= bounds.max) {
        next.delete("minPrice");
        next.delete("maxPrice");
      } else {
        next.set("minPrice", String(priceValue[0]));
        next.set("maxPrice", String(priceValue[1]));
      }
      setSearchParams(next, { replace: true });
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceValue]);

  const { data: products, isLoading } = useProducts({
    categorySlugs: selectedSlugs.length > 0 ? selectedSlugs : undefined,
    search: initialQuery,
    minPrice: minPriceParam ? Number(minPriceParam) : undefined,
    maxPrice: maxPriceParam ? Number(maxPriceParam) : undefined,
  });

  useSeo({
    title: t("shop.title"),
    description: t("hero.subtitle"),
  });

  const setSelectedSlugs = (slugs: string[]) => {
    const next = new URLSearchParams(searchParams);
    if (slugs.length > 0) next.set("categories", slugs.join(","));
    else next.delete("categories");
    setSearchParams(next);
  };

  const handlePillClick = (slug: string) => {
    if (slug === "") {
      setSelectedSlugs([]);
    } else if (selectedSlugs.length === 1 && selectedSlugs[0] === slug) {
      setSelectedSlugs([]);
    } else {
      setSelectedSlugs([slug]);
    }
  };

  const handleToggleSlug = (slug: string) => {
    if (selectedSlugs.includes(slug)) {
      setSelectedSlugs(selectedSlugs.filter((s) => s !== slug));
    } else {
      setSelectedSlugs([...selectedSlugs, slug]);
    }
  };

  const handleResetFilters = () => {
    setPriceValue([bounds.min, bounds.max]);
    const next = new URLSearchParams(searchParams);
    next.delete("categories");
    next.delete("minPrice");
    next.delete("maxPrice");
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchInput.trim()) next.set("q", searchInput.trim());
    else next.delete("q");
    setSearchParams(next);
  };

  const pillClass = (active: boolean) =>
    cn(
      "shrink-0 rounded-full border-2 px-4 py-1.5 text-sm font-extrabold transition-all hover:-translate-y-0.5",
      active ? "border-ink bg-ink text-bg" : "border-line bg-panel text-ink hover:border-ink",
    );

  const filtersPanel = (
    <ShopFilters
      categories={categories}
      selectedSlugs={selectedSlugs}
      onToggleSlug={handleToggleSlug}
      priceBounds={bounds}
      priceValue={priceValue}
      onPriceChange={setPriceValue}
      onReset={handleResetFilters}
    />
  );

  return (
    <div className="bg-tint-blue">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="inline-block font-display text-3xl font-extrabold text-ink">{t("shop.title")}</h1>

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

        {/* Category pills */}
        <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-2">
          <button
            data-active={selectedSlugs.length === 0}
            onClick={() => handlePillClick("")}
            className={pillClass(selectedSlugs.length === 0)}
          >
            {t("shop.filter.all")}
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handlePillClick(cat.slug)}
              className={pillClass(selectedSlugs.length === 1 && selectedSlugs[0] === cat.slug)}
            >
              {localize(cat, "name", lang)}
            </button>
          ))}
        </div>

        <button
          onClick={() => setFiltersOpen(true)}
          className="mt-2 flex items-center gap-2 rounded-full border-2 border-line bg-panel px-4 py-1.5 text-sm font-extrabold text-ink transition-colors hover:border-ink lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t("shop.filter.title")}
        </button>

        <p className="mt-4 flex items-center gap-2 text-sm font-bold text-muted">
          <Paw className="h-4 w-4 text-brand/50" />
          {isLoading ? t("common.loading") : `${products?.length ?? 0} ${t("shop.results")}`}
        </p>

        <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-24">{filtersPanel}</div>
          </aside>

          <div>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">
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
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">
                {products?.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} side="left" title={t("shop.filter.title")}>
        <div className="p-4">{filtersPanel}</div>
      </Drawer>
    </div>
  );
}
