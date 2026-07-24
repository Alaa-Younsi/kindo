import { Check } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { localize } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/db";

const ANIMAL_SLUGS = ["chiens", "chats", "oiseaux", "poissons"];
const PRODUCT_TYPE_SLUGS = ["alimentation-soins", "accessoires"];

function CheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1.5 text-sm font-semibold text-ink">
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
          checked ? "border-ink bg-ink text-bg" : "border-line bg-panel",
        )}
      >
        {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      {label}
    </label>
  );
}

function PriceRangeSlider({
  min,
  max,
  value,
  onChange,
}: {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}) {
  const [lo, hi] = value;
  const span = Math.max(max - min, 1);
  const loPct = ((lo - min) / span) * 100;
  const hiPct = ((hi - min) / span) * 100;

  return (
    <div className="pt-1">
      <div className="relative h-1.5 rounded-full bg-line">
        <div
          className="absolute h-1.5 rounded-full bg-brand"
          style={{ left: `${loPct}%`, right: `${100 - hiPct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={lo}
          onChange={(e) => onChange([Math.min(Number(e.target.value), hi), hi])}
          className="range-thumb absolute inset-x-0 top-1/2 h-1.5 w-full -translate-y-1/2"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={hi}
          onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo)])}
          className="range-thumb absolute inset-x-0 top-1/2 h-1.5 w-full -translate-y-1/2"
        />
      </div>
      <div className="mt-4 flex items-center justify-between text-sm font-bold text-muted">
        <span>{lo.toLocaleString()} DA</span>
        <span>{hi.toLocaleString()} DA</span>
      </div>
    </div>
  );
}

interface ShopFiltersProps {
  categories: Category[] | undefined;
  selectedSlugs: string[];
  onToggleSlug: (slug: string) => void;
  priceBounds: { min: number; max: number };
  priceValue: [number, number];
  onPriceChange: (value: [number, number]) => void;
  onReset: () => void;
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b-2 border-line py-5 first:pt-0 last:border-b-0">
      <h3 className="mb-3 font-display text-sm font-extrabold uppercase tracking-wide text-ink">{title}</h3>
      {children}
    </div>
  );
}

export function ShopFilters({
  categories,
  selectedSlugs,
  onToggleSlug,
  priceBounds,
  priceValue,
  onPriceChange,
  onReset,
}: ShopFiltersProps) {
  const { t, lang } = useLanguage();
  const animalCats = categories?.filter((c) => ANIMAL_SLUGS.includes(c.slug)) ?? [];
  const productTypeCats = categories?.filter((c) => PRODUCT_TYPE_SLUGS.includes(c.slug)) ?? [];

  return (
    <div className="rounded-3xl border-2 border-line bg-panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-extrabold text-ink">{t("shop.filter.title")}</h2>
        <button
          onClick={onReset}
          className="text-xs font-bold uppercase tracking-wide text-muted transition-colors hover:text-brand"
        >
          {t("shop.filter.reset")}
        </button>
      </div>

      <FilterGroup title={t("shop.filter.price")}>
        <PriceRangeSlider
          min={priceBounds.min}
          max={priceBounds.max}
          value={priceValue}
          onChange={onPriceChange}
        />
      </FilterGroup>

      {animalCats.length > 0 && (
        <FilterGroup title={t("shop.filter.animal")}>
          {animalCats.map((cat) => (
            <CheckboxRow
              key={cat.id}
              label={localize(cat, "name", lang)}
              checked={selectedSlugs.includes(cat.slug)}
              onChange={() => onToggleSlug(cat.slug)}
            />
          ))}
        </FilterGroup>
      )}

      {productTypeCats.length > 0 && (
        <FilterGroup title={t("shop.filter.productType")}>
          {productTypeCats.map((cat) => (
            <CheckboxRow
              key={cat.id}
              label={localize(cat, "name", lang)}
              checked={selectedSlugs.includes(cat.slug)}
              onChange={() => onToggleSlug(cat.slug)}
            />
          ))}
        </FilterGroup>
      )}
    </div>
  );
}
