import { PawScatter, Paw } from "@/components/effects/PawScatter";
import { CatMascot } from "@/components/effects/mascots";
import { useLanguage } from "@/i18n/LanguageProvider";

/**
 * Slim, always-visible strip announcing the store isn't open yet.
 * Rendered at the top of every storefront page while COMING_SOON is on.
 */
export function ComingSoonBanner() {
  const { t } = useLanguage();
  return (
    <div className="bg-cta-gradient relative overflow-hidden text-white">
      <PawScatter count={4} className="text-white" />
      <div className="relative mx-auto flex max-w-7xl items-center justify-center gap-2.5 px-4 py-2.5 text-center sm:px-6 lg:px-8">
        <Paw className="h-4 w-4 shrink-0 text-white/90" />
        <p className="text-xs font-extrabold sm:text-sm">{t("comingSoon.banner")}</p>
        <Paw className="h-4 w-4 shrink-0 text-white/90" />
      </div>
    </div>
  );
}

/**
 * Large centered "Coming Soon" panel shown in place of product listings
 * (Shop grid, product detail) so no products are exposed to customers.
 */
export function ComingSoonPanel() {
  const { t } = useLanguage();
  return (
    <section className="bg-tint-yellow relative overflow-hidden">
      <PawScatter count={6} />
      <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 sm:py-28">
        <span className="flex h-40 w-40 items-center justify-center rounded-full bg-brand/10 ring-4 ring-brand/20 sm:h-48 sm:w-48">
          <CatMascot className="h-32 w-32 sm:h-40 sm:w-40" />
        </span>

        <span className="inline-flex items-center gap-2 rounded-full border-2 border-brand/40 bg-brand/10 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide text-brand">
          <Paw className="h-4 w-4" />
          {t("comingSoon.badge")}
        </span>

        <h1 className="font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
          <span className="bg-gradient-to-r from-brand via-blue to-green bg-clip-text text-transparent">
            {t("comingSoon.title")}
          </span>
        </h1>

        <p className="max-w-md text-base text-muted sm:text-lg">{t("comingSoon.text")}</p>
      </div>
    </section>
  );
}
