import { useState } from "react";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/i18n/LanguageProvider";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/image";
import { slugify } from "@/lib/utils";
import type { ProductColor } from "@/types/db";

interface ColorsEditorProps {
  value: ProductColor[];
  onChange: (colors: ProductColor[]) => void;
  /** Undefined while creating a new product — colour photo upload needs a
   *  storage path scoped to a real product id, so it's disabled until the
   *  product has been saved once. */
  productId?: string;
}

export function ColorsEditor({ value, onChange, productId }: ColorsEditorProps) {
  const { t } = useLanguage();
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const updateColor = (index: number, patch: Partial<ProductColor>) => {
    onChange(value.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  const addColor = () => {
    onChange([...value, { label_fr: "", label_ar: "", hex: "#000000", image_url: null }]);
  };

  const removeColor = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const uploadColorImage = async (index: number, file: File) => {
    if (!productId) return;
    setUploadingIndex(index);
    try {
      const compressed = await compressImage(file);
      const path = `colors/${productId}/${crypto.randomUUID()}-${slugify(compressed.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, compressed, { cacheControl: "31536000" });
      if (uploadError) throw uploadError;
      const { data: publicUrl } = supabase.storage.from("product-images").getPublicUrl(path);
      updateColor(index, { image_url: publicUrl.publicUrl });
    } finally {
      setUploadingIndex(null);
    }
  };

  return (
    <div className="space-y-3">
      {value.map((c, index) => (
        <div key={index} className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-line p-3">
          <label
            className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-line"
            title={t("admin.products.colorHex")}
          >
            <span aria-hidden className="absolute inset-0" style={{ backgroundColor: c.hex || "#000000" }} />
            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(c.hex) ? c.hex : "#000000"}
              onChange={(e) => updateColor(index, { hex: e.target.value })}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>

          <div className="min-w-[9rem] flex-1">
            <Input
              placeholder={t("admin.products.colorLabelFr")}
              value={c.label_fr}
              onChange={(e) => updateColor(index, { label_fr: e.target.value })}
            />
          </div>
          <div className="min-w-[9rem] flex-1">
            <Input
              placeholder={t("admin.products.colorLabelAr")}
              dir="rtl"
              value={c.label_ar}
              onChange={(e) => updateColor(index, { label_ar: e.target.value })}
            />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {c.image_url ? (
              <div className="group relative h-10 w-10 overflow-hidden rounded-lg border-2 border-line">
                <img src={c.image_url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => updateColor(index, { image_url: null })}
                  className="absolute inset-0 flex items-center justify-center bg-ink/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label={t("admin.delete")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label
                className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 border-dashed border-line text-muted hover:border-blue hover:text-blue ${productId ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
                title={t("admin.products.colorImage")}
              >
                <Upload className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  disabled={!productId || uploadingIndex === index}
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadColorImage(index, e.target.files[0])}
                />
              </label>
            )}
            <button
              type="button"
              onClick={() => removeColor(index)}
              className="rounded-lg p-2 text-muted hover:bg-panel-2 hover:text-brand"
              aria-label={t("admin.delete")}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addColor}>
        <Plus className="h-4 w-4" />
        {t("admin.products.addColor")}
      </Button>
    </div>
  );
}
