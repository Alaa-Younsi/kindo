import { Paw } from "./PawScatter";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { TranslationKey } from "@/i18n/translations";

const ITEMS: Array<{ key: TranslationKey; color: string }> = [
  { key: "trust.cod", color: "text-yellow" },
  { key: "categories.dogs", color: "text-blue-ink/90" },
  { key: "trust.delivery", color: "text-yellow" },
  { key: "categories.cats", color: "text-blue-ink/90" },
  { key: "trust.quality", color: "text-yellow" },
  { key: "categories.birds", color: "text-blue-ink/90" },
  { key: "trust.support", color: "text-yellow" },
  { key: "categories.fish", color: "text-blue-ink/90" },
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
      {ITEMS.map(({ key, color }, i) => (
        <span key={`${key}-${i}`} className={`flex items-center gap-3 px-6 text-sm font-extrabold uppercase tracking-wider ${color}`}>
          <Paw className="h-4 w-4 text-yellow/80" />
          {t(key)}
        </span>
      ))}
    </div>
  );

  return (
    <div dir="ltr" className="relative z-10 -rotate-1 overflow-hidden bg-blue py-3 shadow-lg">
      <div className="marquee-track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
