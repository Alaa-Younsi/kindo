import { Paw } from "./PawScatter";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { TranslationKey } from "@/i18n/translations";

const ITEMS: TranslationKey[] = [
  "trust.cod",
  "categories.dogs",
  "trust.delivery",
  "categories.cats",
  "trust.quality",
  "categories.birds",
  "trust.support",
  "categories.fish",
];

/**
 * Scrolling ticker band between hero and content. Internally forced LTR:
 * the translateX marquee animation doesn't flip with dir, and a decorative
 * ticker reads fine either way.
 */
export function Marquee() {
  const { t } = useLanguage();
  const row = (ariaHidden: boolean) => (
    <div className="flex shrink-0 items-center" aria-hidden={ariaHidden}>
      {ITEMS.map((key, i) => (
        <span
          key={`${key}-${i}`}
          className="mx-1.5 flex items-center gap-2 rounded-full border-2 border-panel bg-panel px-5 py-2 text-base font-extrabold uppercase tracking-wide text-ink"
        >
          <Paw className="h-4 w-4 opacity-60" />
          {t(key)}
        </span>
      ))}
    </div>
  );

  return (
    <div dir="ltr" className="relative z-10 overflow-hidden bg-ink py-3 shadow-lg">
      <div className="marquee-track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
