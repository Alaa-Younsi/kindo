import { Fragment, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageOff, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useLanguage } from "@/i18n/LanguageProvider";
import { slugify, uniqueSlug } from "@/lib/utils";
import { compressImage } from "@/lib/image";
import { buildCategoryTree, descendantIds, type CategoryNode } from "@/lib/categories";
import type { Category } from "@/types/db";

interface CategoryFormState {
  id?: string;
  name_fr: string;
  name_ar: string;
  description_fr: string;
  description_ar: string;
  image_url: string | null;
  sort_order: number;
  parent_id: string | null;
}

const EMPTY_FORM: CategoryFormState = {
  name_fr: "",
  name_ar: "",
  description_fr: "",
  description_ar: "",
  image_url: null,
  sort_order: 0,
  parent_id: null,
};

function useCategoriesAdmin() {
  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export default function AdminCategories() {
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useCategoriesAdmin();
  const [form, setForm] = useState<CategoryFormState | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tree = categories ? buildCategoryTree(categories) : [];
  const excludedIds = form?.id ? descendantIds(categories ?? [], form.id) : new Set<string>();

  const saveMutation = useMutation({
    mutationFn: async (values: CategoryFormState) => {
      if (values.id) {
        const { error } = await supabase
          .from("categories")
          .update({
            name_fr: values.name_fr,
            name_ar: values.name_ar,
            description_fr: values.description_fr || null,
            description_ar: values.description_ar || null,
            image_url: values.image_url,
            sort_order: values.sort_order,
            parent_id: values.parent_id,
          })
          .eq("id", values.id);
        if (error) throw error;
      } else {
        const slug = await uniqueSlug(values.name_fr, async (candidate) => {
          const { data } = await supabase
            .from("categories")
            .select("id")
            .eq("slug", candidate)
            .maybeSingle();
          return !!data;
        });
        const { error } = await supabase.from("categories").insert({
          slug,
          name_fr: values.name_fr,
          name_ar: values.name_ar,
          description_fr: values.description_fr || null,
          description_ar: values.description_ar || null,
          image_url: values.image_url,
          sort_order: values.sort_order,
          parent_id: values.parent_id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setForm(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const path = `categories/${crypto.randomUUID()}-${slugify(compressed.name)}`;
      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, compressed, { cacheControl: "31536000" });
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setForm((f) => (f ? { ...f, image_url: data.publicUrl } : f));
    } finally {
      setUploading(false);
    }
  };

  const openEdit = (cat: Category) => {
    setForm({
      id: cat.id,
      name_fr: cat.name_fr,
      name_ar: cat.name_ar,
      description_fr: cat.description_fr ?? "",
      description_ar: cat.description_ar ?? "",
      image_url: cat.image_url,
      sort_order: cat.sort_order,
      parent_id: cat.parent_id,
    });
  };

  const openAddChild = (parent: Category) => {
    setForm({ ...EMPTY_FORM, parent_id: parent.id });
  };

  const handleDelete = (node: CategoryNode) => {
    const message =
      node.children.length > 0
        ? `${t("admin.confirmDelete")} (${node.children.length} sous-catégorie(s) seront aussi supprimées)`
        : t("admin.confirmDelete");
    if (confirm(message)) deleteMutation.mutate(node.id);
  };

  const renderRows = (nodes: CategoryNode[], depth: number): React.ReactNode =>
    nodes.map((cat) => (
      <Fragment key={cat.id}>
        <tr className="border-b border-line last:border-0">
          <td className="px-4 py-3 font-bold text-ink">
            <span style={{ paddingInlineStart: `${depth * 20}px` }} className="flex items-center gap-2">
              {depth > 0 && <span className="text-muted">└</span>}
              {cat.image_url ? (
                <img src={cat.image_url} alt="" className="h-8 w-8 rounded-lg object-cover" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-panel-2 text-line">
                  <ImageOff className="h-4 w-4" />
                </span>
              )}
              {lang === "ar" ? cat.name_ar : cat.name_fr}
            </span>
          </td>
          <td className="px-4 py-3 text-end">
            <button
              onClick={() => openAddChild(cat)}
              title="Ajouter une sous-catégorie"
              className="me-2 rounded-lg p-1.5 text-green hover:bg-green/10"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button onClick={() => openEdit(cat)} className="me-2 rounded-lg p-1.5 text-blue hover:bg-blue/10">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => handleDelete(cat)} className="rounded-lg p-1.5 text-brand hover:bg-brand/10">
              <Trash2 className="h-4 w-4" />
            </button>
          </td>
        </tr>
        {cat.children.length > 0 && renderRows(cat.children, depth + 1)}
      </Fragment>
    ));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-ink">{t("admin.nav.categories")}</h1>
        <Button variant="brand" size="sm" onClick={() => setForm(EMPTY_FORM)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          {t("admin.add")}
        </Button>
      </div>

      {form && (
        <div className="mt-4 rounded-2xl border-2 border-brand/30 bg-brand/5 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Nom (FR)"
              value={form.name_fr}
              onChange={(e) => setForm({ ...form, name_fr: e.target.value })}
            />
            <Input
              placeholder="الاسم (AR)"
              dir="rtl"
              value={form.name_ar}
              onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
            />
            <Textarea
              placeholder="Description (FR)"
              value={form.description_fr}
              onChange={(e) => setForm({ ...form, description_fr: e.target.value })}
            />
            <Textarea
              placeholder="الوصف (AR)"
              dir="rtl"
              value={form.description_ar}
              onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
            />
          </div>

          <div className="mt-3">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">
              Catégorie parente
            </label>
            <Select
              value={form.parent_id ?? ""}
              onChange={(e) => setForm({ ...form, parent_id: e.target.value || null })}
            >
              <option value="">— Aucune (catégorie principale) —</option>
              {categories
                ?.filter((c) => c.id !== form.id && !excludedIds.has(c.id))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.parent_id ? "— " : ""}
                    {c.name_fr}
                  </option>
                ))}
            </Select>
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">
              Image de la catégorie
            </label>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-line bg-panel-2">
                {form.image_url ? (
                  <img src={form.image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageOff className="h-6 w-6 text-line" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5"
              >
                <Upload className="h-4 w-4" />
                {uploading ? t("admin.saving") : form.image_url ? "Changer l'image" : "Ajouter une image"}
              </Button>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              variant="brand"
              size="sm"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate(form)}
            >
              {saveMutation.isPending ? t("admin.saving") : t("admin.save")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setForm(null)}>
              {t("admin.cancel")}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border-2 border-line bg-panel">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b-2 border-line text-muted">
              <th className="px-4 py-3 text-start font-bold">Nom</th>
              <th className="px-4 py-3 text-start font-bold" />
            </tr>
          </thead>
          <tbody>{!isLoading && renderRows(tree, 0)}</tbody>
        </table>
      </div>
    </div>
  );
}
