import { Paw } from "@/components/effects/PawScatter";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useSeo } from "@/hooks/useSeo";
import { useResolvedPolicy } from "@/hooks/usePolicy";

export default function Policy() {
  const { t, lang } = useLanguage();
  const { data, isLoading } = useResolvedPolicy(lang);

  useSeo({ title: data.title || t("policy.title"), description: data.intro });

  return (
    <div className="bg-tint-blue">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-extrabold text-ink">{data.title}</h1>
        {data.intro && <p className="mt-4 text-sm leading-relaxed text-muted">{data.intro}</p>}

        {isLoading && data.sections.length === 0 ? (
          <p className="mt-8 text-muted">{t("common.loading")}</p>
        ) : (
          <div className="mt-8 space-y-6">
            {data.sections.map((section, i) => (
              <section
                key={section.id}
                className="rounded-2xl border-2 border-line bg-panel p-5 shadow-sm"
              >
                <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-ink">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xs font-extrabold text-brand">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {section.title}
                </h2>
                {section.body && (
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">
                    {section.body}
                  </p>
                )}
              </section>
            ))}
          </div>
        )}

        {data.updatedLabel && (
          <p className="mt-8 flex items-center gap-2 text-xs text-muted">
            <Paw className="h-3.5 w-3.5 text-brand/40" />
            {data.updatedLabel}
          </p>
        )}
      </div>
    </div>
  );
}
