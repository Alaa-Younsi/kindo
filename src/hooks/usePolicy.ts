import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { translations, type Lang, type TranslationKey } from "@/i18n/translations";
import type { PolicySectionRow, PolicySettingsRow } from "@/types/db";

/** Built-in sections the APP ships text for. builtin_key ↔ 0015 seed rows. */
export const BUILTIN_POLICY_SECTIONS: {
  builtin_key: string;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
}[] = [
  { builtin_key: "policy_s1", titleKey: "policy.s1.title", bodyKey: "policy.s1.body" },
  { builtin_key: "policy_s2", titleKey: "policy.s2.title", bodyKey: "policy.s2.body" },
  { builtin_key: "policy_s3", titleKey: "policy.s3.title", bodyKey: "policy.s3.body" },
  { builtin_key: "policy_s4", titleKey: "policy.s4.title", bodyKey: "policy.s4.body" },
  { builtin_key: "policy_s5", titleKey: "policy.s5.title", bodyKey: "policy.s5.body" },
];

export interface ResolvedPolicySection {
  id: string;
  builtinKey: string | null;
  title: string;
  body: string;
}
export interface ResolvedPolicy {
  title: string;
  intro: string;
  updatedLabel: string;
  sections: ResolvedPolicySection[];
}

function compiled(key: TranslationKey | null, lang: Lang): string {
  if (!key) return "";
  return translations[lang]?.[key] ?? translations.fr[key] ?? "";
}

/** override(active lang) → override(fr) → compiled(active lang) → compiled(fr). */
function resolveField(
  overrideActive: string | null | undefined,
  overrideFr: string | null | undefined,
  compiledKey: TranslationKey | null,
  lang: Lang,
): string {
  const clean = (v: string | null | undefined) => (v && v.trim() ? v.trim() : "");
  return (
    clean(lang === "ar" ? overrideActive : overrideFr) ||
    clean(overrideFr) ||
    compiled(compiledKey, lang) ||
    compiled(compiledKey, "fr")
  );
}

export function useRawPolicy() {
  return useQuery({
    queryKey: ["policy", "raw"],
    retry: 0,
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const [settingsRes, sectionsRes] = await Promise.all([
        supabase.from("policy_settings").select("*").eq("id", true).maybeSingle(),
        supabase.from("policy_sections").select("*").order("sort_order", { ascending: true }),
      ]);
      if (settingsRes.error) throw settingsRes.error;
      if (sectionsRes.error) throw sectionsRes.error;
      return {
        settings: (settingsRes.data as PolicySettingsRow | null) ?? null,
        sections: (sectionsRes.data as PolicySectionRow[]) ?? [],
      };
    },
  });
}

/** One resolver, used by the public page and the editor's preview. Falls back
 *  to the fully-compiled built-in list when the table can't be read at all. */
export function useResolvedPolicy(lang: Lang): { data: ResolvedPolicy; isLoading: boolean } {
  const { data, isLoading, isError } = useRawPolicy();

  const builtinFallback = (): ResolvedPolicy => ({
    title: compiled("policy.title", lang),
    intro: compiled("policy.intro", lang),
    updatedLabel: compiled("policy.updatedLabel", lang),
    sections: BUILTIN_POLICY_SECTIONS.map((b) => ({
      id: b.builtin_key,
      builtinKey: b.builtin_key,
      title: compiled(b.titleKey, lang),
      body: compiled(b.bodyKey, lang),
    })),
  });

  if (isError || !data) {
    return { data: builtinFallback(), isLoading };
  }

  const s = data.settings;
  const resolved: ResolvedPolicy = {
    title: resolveField(
      lang === "ar" ? s?.title_ar : s?.title_fr,
      s?.title_fr,
      "policy.title",
      lang,
    ),
    intro: resolveField(lang === "ar" ? s?.intro_ar : s?.intro_fr, s?.intro_fr, "policy.intro", lang),
    updatedLabel: resolveField(
      lang === "ar" ? s?.updated_label_ar : s?.updated_label_fr,
      s?.updated_label_fr,
      "policy.updatedLabel",
      lang,
    ),
    sections: data.sections
      .filter((row) => row.active)
      .map((row) => {
        const builtin = BUILTIN_POLICY_SECTIONS.find((b) => b.builtin_key === row.builtin_key);
        return {
          id: row.id,
          builtinKey: row.builtin_key,
          title: resolveField(
            lang === "ar" ? row.title_ar : row.title_fr,
            row.title_fr,
            builtin?.titleKey ?? null,
            lang,
          ),
          body: resolveField(
            lang === "ar" ? row.body_ar : row.body_fr,
            row.body_fr,
            builtin?.bodyKey ?? null,
            lang,
          ),
        };
      })
      // A custom section with nothing filled in resolves to empty — drop it.
      .filter((sec) => sec.title || sec.body),
  };

  return { data: resolved, isLoading };
}
