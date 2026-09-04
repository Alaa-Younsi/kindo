import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { BUILTIN_POLICY_SECTIONS, useRawPolicy } from "@/hooks/usePolicy";
import { useAdminToast } from "@/components/admin/AdminToast";
import { useLanguage } from "@/i18n/LanguageProvider";
import { translations } from "@/i18n/translations";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import type { PolicySectionRow, PolicySettingsRow } from "@/types/db";

const nullify = (v: string) => (v.trim() === "" ? null : v.trim());

/** Two inputs (FR + AR) whose placeholder is the compiled default — an empty
 *  box reads as "still the original". */
function OverridePair({
  label,
  frValue,
  arValue,
  frPlaceholder,
  arPlaceholder,
  onFr,
  onAr,
  multiline,
}: {
  label: string;
  frValue: string;
  arValue: string;
  frPlaceholder: string;
  arPlaceholder: string;
  onFr: (v: string) => void;
  onAr: (v: string) => void;
  multiline?: boolean;
}) {
  const { t } = useLanguage();
  const Field = multiline ? Textarea : Input;
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">{label}</label>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <span className="mb-1 block text-[11px] font-bold text-muted">{t("admin.policy.fr")}</span>
          <Field
            {...(multiline ? { rows: 4 } : {})}
            value={frValue}
            placeholder={frPlaceholder}
            onChange={(e) => onFr(e.target.value)}
          />
        </div>
        <div>
          <span className="mb-1 block text-[11px] font-bold text-muted">{t("admin.policy.ar")}</span>
          <Field
            {...(multiline ? { rows: 4 } : {})}
            dir="rtl"
            value={arValue}
            placeholder={arPlaceholder}
            onChange={(e) => onAr(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

function SectionEditor({ row }: { row: PolicySectionRow }) {
  const { t } = useLanguage();
  const { toast } = useAdminToast();
  const qc = useQueryClient();
  const builtin = BUILTIN_POLICY_SECTIONS.find((b) => b.builtin_key === row.builtin_key);
  const titlePh = { fr: "", ar: "" };
  const bodyPh = { fr: "", ar: "" };
  if (builtin) {
    titlePh.fr = translations.fr[builtin.titleKey] ?? "";
    titlePh.ar = translations.ar[builtin.titleKey] ?? "";
    bodyPh.fr = translations.fr[builtin.bodyKey] ?? "";
    bodyPh.ar = translations.ar[builtin.bodyKey] ?? "";
  }

  const [f, setF] = useState({
    title_fr: row.title_fr ?? "",
    title_ar: row.title_ar ?? "",
    body_fr: row.body_fr ?? "",
    body_ar: row.body_ar ?? "",
  });

  const mut = useMutation({
    mutationFn: async (patch: Partial<PolicySectionRow>) => {
      const { error } = await supabase.from("policy_sections").update(patch).eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["policy"] });
      toast(t("admin.saved"));
    },
    onError: () => toast(t("admin.saveError"), "error"),
  });

  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("policy_sections").delete().eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["policy"] });
      toast(t("admin.saved"));
    },
    onError: () => toast(t("admin.deleteError"), "error"),
  });

  const save = () => {
    if (!row.builtin_key && (!f.title_fr.trim() || !f.body_fr.trim())) {
      return toast(t("admin.policy.newSectionNeedsFr"), "error");
    }
    mut.mutate({
      title_fr: nullify(f.title_fr),
      title_ar: nullify(f.title_ar),
      body_fr: nullify(f.body_fr),
      body_ar: nullify(f.body_ar),
    });
  };

  return (
    <div className={`space-y-3 rounded-2xl border-2 border-line bg-panel p-4 ${!row.active ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold uppercase tracking-wide text-muted">
          {row.builtin_key ?? t("admin.policy.addSection")}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => mut.mutate({ active: !row.active })}
            className="rounded-lg p-2 text-muted hover:bg-panel-2"
            aria-label={row.active ? t("admin.policy.hide") : t("admin.policy.show")}
          >
            {row.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          {!row.builtin_key && (
            <button
              onClick={() => del.mutate()}
              className="rounded-lg p-2 text-muted hover:bg-brand/10 hover:text-brand"
              aria-label={t("admin.policy.deleteSection")}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <OverridePair
        label={t("admin.policy.sectionTitle")}
        frValue={f.title_fr}
        arValue={f.title_ar}
        frPlaceholder={titlePh.fr}
        arPlaceholder={titlePh.ar}
        onFr={(v) => setF((s) => ({ ...s, title_fr: v }))}
        onAr={(v) => setF((s) => ({ ...s, title_ar: v }))}
      />
      <OverridePair
        label={t("admin.policy.sectionBody")}
        multiline
        frValue={f.body_fr}
        arValue={f.body_ar}
        frPlaceholder={bodyPh.fr}
        arPlaceholder={bodyPh.ar}
        onFr={(v) => setF((s) => ({ ...s, body_fr: v }))}
        onAr={(v) => setF((s) => ({ ...s, body_ar: v }))}
      />
      <Button variant="brand" size="sm" disabled={mut.isPending} onClick={save}>
        {mut.isPending ? t("admin.saving") : t("admin.save")}
      </Button>
    </div>
  );
}

export default function Policy() {
  const { t } = useLanguage();
  const { toast } = useAdminToast();
  const qc = useQueryClient();
  const { data, isLoading } = useRawPolicy();

  const [s, setS] = useState({
    title_fr: "",
    title_ar: "",
    intro_fr: "",
    intro_ar: "",
    updated_label_fr: "",
    updated_label_ar: "",
  });

  useEffect(() => {
    const p = data?.settings;
    if (!p) return;
    setS({
      title_fr: p.title_fr ?? "",
      title_ar: p.title_ar ?? "",
      intro_fr: p.intro_fr ?? "",
      intro_ar: p.intro_ar ?? "",
      updated_label_fr: p.updated_label_fr ?? "",
      updated_label_ar: p.updated_label_ar ?? "",
    });
  }, [data]);

  const saveSettings = useMutation({
    mutationFn: async () => {
      const patch: Partial<PolicySettingsRow> = {
        title_fr: nullify(s.title_fr),
        title_ar: nullify(s.title_ar),
        intro_fr: nullify(s.intro_fr),
        intro_ar: nullify(s.intro_ar),
        updated_label_fr: nullify(s.updated_label_fr),
        updated_label_ar: nullify(s.updated_label_ar),
      };
      const { error } = await supabase.from("policy_settings").update(patch).eq("id", true);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["policy"] });
      toast(t("admin.saved"));
    },
    onError: () => toast(t("admin.saveError"), "error"),
  });

  const addSection = useMutation({
    mutationFn: async () => {
      const nextOrder = Math.max(0, ...(data?.sections.map((x) => x.sort_order) ?? [0])) + 1;
      const { error } = await supabase
        .from("policy_sections")
        .insert({ builtin_key: null, sort_order: nextOrder, active: true });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["policy"] }),
    onError: () => toast(t("admin.saveError"), "error"),
  });

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-extrabold text-ink">{t("admin.policy.title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("admin.policy.subtitle")}</p>
      <p className="mt-1 text-xs text-muted">{t("admin.policy.restoreHint")}</p>

      <div className="mt-6 space-y-3 rounded-2xl border-2 border-line bg-panel p-4">
        <OverridePair
          label={t("admin.policy.pageTitle")}
          frValue={s.title_fr}
          arValue={s.title_ar}
          frPlaceholder={translations.fr["policy.title"]}
          arPlaceholder={translations.ar["policy.title"]}
          onFr={(v) => setS((x) => ({ ...x, title_fr: v }))}
          onAr={(v) => setS((x) => ({ ...x, title_ar: v }))}
        />
        <OverridePair
          label={t("admin.policy.intro")}
          multiline
          frValue={s.intro_fr}
          arValue={s.intro_ar}
          frPlaceholder={translations.fr["policy.intro"]}
          arPlaceholder={translations.ar["policy.intro"]}
          onFr={(v) => setS((x) => ({ ...x, intro_fr: v }))}
          onAr={(v) => setS((x) => ({ ...x, intro_ar: v }))}
        />
        <OverridePair
          label={t("admin.policy.updatedLabel")}
          frValue={s.updated_label_fr}
          arValue={s.updated_label_ar}
          frPlaceholder={translations.fr["policy.updatedLabel"]}
          arPlaceholder={translations.ar["policy.updatedLabel"]}
          onFr={(v) => setS((x) => ({ ...x, updated_label_fr: v }))}
          onAr={(v) => setS((x) => ({ ...x, updated_label_ar: v }))}
        />
        <Button
          variant="brand"
          size="sm"
          disabled={saveSettings.isPending}
          onClick={() => saveSettings.mutate()}
        >
          {saveSettings.isPending ? t("admin.saving") : t("admin.save")}
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        {!isLoading &&
          data?.sections.map((row) => <SectionEditor key={row.id} row={row} />)}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="mt-4"
        disabled={addSection.isPending}
        onClick={() => addSection.mutate()}
      >
        <Plus className="h-4 w-4" />
        {t("admin.policy.addSection")}
      </Button>
    </div>
  );
}
