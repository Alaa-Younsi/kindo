import { useState } from "react";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SmartImage } from "@/components/ui/SmartImage";
import { useAdminToast } from "@/components/admin/AdminToast";
import { useLanguage } from "@/i18n/LanguageProvider";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/image";
import { slugify } from "@/lib/utils";
import type { VariantGroup, VariantOption } from "@/types/db";

interface CustomVariantsEditorProps {
  value: VariantGroup[];
  onChange: (groups: VariantGroup[]) => void;
  /** Undefined while creating a new product — an option photo needs a storage
   *  path scoped to a real product id, so uploads are disabled until the first
   *  save (same rule as ColorsEditor). */
  productId?: string;
}

export function CustomVariantsEditor({ value, onChange, productId }: CustomVariantsEditorProps) {
  const { t } = useLanguage();
  const { toast } = useAdminToast();
  const [uploading, setUploading] = useState<string | null>(null);

  const setGroup = (gi: number, patch: Partial<VariantGroup>) =>
    onChange(value.map((g, i) => (i === gi ? { ...g, ...patch } : g)));

  const setOption = (gi: number, oi: number, patch: Partial<VariantOption>) =>
    setGroup(gi, {
      values: value[gi].values.map((o, i) => (i === oi ? { ...o, ...patch } : o)),
    });

  const addGroup = () => onChange([...value, { name_fr: "", name_ar: "", values: [] }]);
  const removeGroup = (gi: number) => onChange(value.filter((_, i) => i !== gi));

  const addOption = (gi: number) =>
    setGroup(gi, { values: [...value[gi].values, { value_fr: "", value_ar: "", image_url: null }] });
  const removeOption = (gi: number, oi: number) =>
    setGroup(gi, { values: value[gi].values.filter((_, i) => i !== oi) });

  const uploadOptionImage = async (gi: number, oi: number, file: File) => {
    if (!productId) return;
    const key = `${gi}:${oi}`;
    setUploading(key);
    try {
      const compressed = await compressImage(file);
      const path = `variants/${productId}/${crypto.randomUUID()}-${slugify(compressed.name)}`;
      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, compressed, { cacheControl: "31536000" });
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setOption(gi, oi, { image_url: data.publicUrl });
    } catch {
      toast(t("admin.uploadError"), "error");
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-4">
      {value.map((group, gi) => (
        <div key={gi} className="rounded-2xl border-2 border-line p-4">
          <div className="flex items-start gap-2">
            <div className="grid flex-1 gap-2 sm:grid-cols-2">
              <Input
                placeholder={t("admin.products.variantNameFr")}
                value={group.name_fr}
                onChange={(e) => setGroup(gi, { name_fr: e.target.value })}
              />
              <Input
                placeholder={t("admin.products.variantNameAr")}
                dir="rtl"
                value={group.name_ar}
                onChange={(e) => setGroup(gi, { name_ar: e.target.value })}
              />
            </div>
            <button
              type="button"
              onClick={() => removeGroup(gi)}
              className="mt-2.5 shrink-0 rounded-lg p-2 text-muted hover:bg-panel-2 hover:text-brand"
              aria-label={t("admin.delete")}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {group.values.map((opt, oi) => {
              const busy = uploading === `${gi}:${oi}`;
              return (
                <div
                  key={oi}
                  className="flex flex-wrap items-center gap-2 rounded-xl border-2 border-line bg-panel-2 p-2"
                >
                  <div className="min-w-[8rem] flex-1">
                    <Input
                      placeholder={t("admin.products.variantValueFr")}
                      value={opt.value_fr}
                      onChange={(e) => setOption(gi, oi, { value_fr: e.target.value })}
                    />
                  </div>
                  <div className="min-w-[8rem] flex-1">
                    <Input
                      placeholder={t("admin.products.variantValueAr")}
                      dir="rtl"
                      value={opt.value_ar}
                      onChange={(e) => setOption(gi, oi, { value_ar: e.target.value })}
                    />
                  </div>

                  {opt.image_url ? (
                    <div className="group relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border-2 border-line">
                      <SmartImage
                        src={opt.image_url}
                        alt=""
                        width={40}
                        height={40}
                        sizes="40px"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setOption(gi, oi, { image_url: null })}
                        className="absolute inset-0 flex items-center justify-center bg-ink/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label={t("admin.delete")}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label
                      title={t("admin.products.variantOptionImage")}
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-line text-muted hover:border-blue hover:text-blue ${
                        productId ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                      }`}
                    >
                      {busy ? <span className="text-xs">…</span> : <Upload className="h-4 w-4" />}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={!productId || busy}
                        className="hidden"
                        onChange={(e) =>
                          e.target.files?.[0] && uploadOptionImage(gi, oi, e.target.files[0])
                        }
                      />
                    </label>
                  )}

                  <button
                    type="button"
                    onClick={() => removeOption(gi, oi)}
                    className="shrink-0 rounded-lg p-2 text-muted hover:bg-panel hover:text-brand"
                    aria-label={t("admin.delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => addOption(gi)}
          >
            <Plus className="h-4 w-4" />
            {t("admin.products.addVariantOption")}
          </Button>
          {!productId && (
            <p className="mt-2 text-xs text-muted">{t("admin.products.saveFirstForImages")}</p>
          )}
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addGroup}>
        <Plus className="h-4 w-4" />
        {t("admin.products.addVariantGroup")}
      </Button>
    </div>
  );
}
