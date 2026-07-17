import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { VariantGroup } from "@/types/db";

interface CustomVariantsEditorProps {
  value: VariantGroup[];
  onChange: (groups: VariantGroup[]) => void;
}

export function CustomVariantsEditor({ value, onChange }: CustomVariantsEditorProps) {
  const { t } = useLanguage();
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  const updateGroup = (index: number, patch: Partial<VariantGroup>) => {
    onChange(value.map((g, i) => (i === index ? { ...g, ...patch } : g)));
  };

  const addGroup = () => {
    onChange([...value, { name_fr: "", name_ar: "", values: [] }]);
  };

  const removeGroup = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const addValue = (index: number) => {
    const draft = (drafts[index] ?? "").trim();
    if (!draft || value[index].values.includes(draft)) {
      setDrafts((d) => ({ ...d, [index]: "" }));
      return;
    }
    updateGroup(index, { values: [...value[index].values, draft] });
    setDrafts((d) => ({ ...d, [index]: "" }));
  };

  const removeValue = (index: number, val: string) => {
    updateGroup(index, { values: value[index].values.filter((v) => v !== val) });
  };

  return (
    <div className="space-y-4">
      {value.map((group, index) => (
        <div key={index} className="rounded-2xl border-2 border-line p-4">
          <div className="flex items-start gap-2">
            <div className="grid flex-1 gap-2 sm:grid-cols-2">
              <Input
                placeholder={t("admin.products.variantNameFr")}
                value={group.name_fr}
                onChange={(e) => updateGroup(index, { name_fr: e.target.value })}
              />
              <Input
                placeholder={t("admin.products.variantNameAr")}
                dir="rtl"
                value={group.name_ar}
                onChange={(e) => updateGroup(index, { name_ar: e.target.value })}
              />
            </div>
            <button
              type="button"
              onClick={() => removeGroup(index)}
              className="mt-2.5 shrink-0 rounded-lg p-2 text-muted hover:bg-panel-2 hover:text-brand"
              aria-label={t("admin.delete")}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {group.values.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {group.values.map((val) => (
                <span
                  key={val}
                  className="flex items-center gap-1.5 rounded-full bg-panel-2 px-3 py-1.5 text-sm font-bold text-ink"
                >
                  {val}
                  <button
                    type="button"
                    onClick={() => removeValue(index, val)}
                    className="text-muted hover:text-brand"
                    aria-label={t("admin.delete")}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <Input
              placeholder={t("admin.products.variantValuePlaceholder")}
              value={drafts[index] ?? ""}
              onChange={(e) => setDrafts((d) => ({ ...d, [index]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addValue(index);
                }
              }}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => addValue(index)}>
              <Plus className="h-4 w-4" />
              {t("admin.add")}
            </Button>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addGroup}>
        <Plus className="h-4 w-4" />
        {t("admin.products.addVariantGroup")}
      </Button>
    </div>
  );
}
