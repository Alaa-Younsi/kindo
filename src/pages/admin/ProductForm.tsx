import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Star, Trash2, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAdminProduct } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { buildCategoryTree, flattenWithDepth } from "@/lib/categories";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SmartImage } from "@/components/ui/SmartImage";
import { CustomVariantsEditor } from "@/components/admin/CustomVariantsEditor";
import { OffersEditor } from "@/components/admin/OffersEditor";
import { ColorsEditor } from "@/components/admin/ColorsEditor";
import { useAdminToast } from "@/components/admin/AdminToast";
import { useLanguage } from "@/i18n/LanguageProvider";
import { slugify, uniqueSlug, sanitizeVariantGroups, sanitizeColors } from "@/lib/utils";
import { sanitizeOffers } from "@/lib/offers";
import { compressImage } from "@/lib/image";
import type { ProductColor, ProductImage, ProductStatus, QuantityOffer, VariantGroup } from "@/types/db";

interface FormState {
  name_fr: string;
  name_ar: string;
  description_fr: string;
  description_ar: string;
  details_fr: string;
  details_ar: string;
  price: string;
  compare_at_price: string;
  category_id: string;
  stock: string;
  style_code: string;
  colors: ProductColor[];
  sizes: string;
  variants: VariantGroup[];
  quantity_offers: QuantityOffer[];
  video_url: string;
  featured: boolean;
  status: ProductStatus;
}

const EMPTY_FORM: FormState = {
  name_fr: "",
  name_ar: "",
  description_fr: "",
  description_ar: "",
  details_fr: "",
  details_ar: "",
  price: "",
  compare_at_price: "",
  category_id: "",
  stock: "0",
  style_code: "",
  colors: [],
  sizes: "",
  variants: [],
  quantity_offers: [],
  video_url: "",
  featured: false,
  status: "draft",
};

export default function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const { toast } = useAdminToast();
  const { data: categories } = useCategories();
  const orderedCategories = categories ? flattenWithDepth(buildCategoryTree(categories)) : [];
  const { data: existing, isLoading: loadingExisting, isError: loadFailed } = useAdminProduct(
    isNew ? undefined : id,
  );

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        name_fr: existing.name_fr,
        name_ar: existing.name_ar,
        description_fr: existing.description_fr ?? "",
        description_ar: existing.description_ar ?? "",
        details_fr: existing.details_fr.join("\n"),
        details_ar: existing.details_ar.join("\n"),
        price: String(existing.price),
        compare_at_price: existing.compare_at_price ? String(existing.compare_at_price) : "",
        category_id: existing.category_id ?? "",
        stock: String(existing.stock),
        style_code: existing.style_code ?? "",
        colors: existing.colors,
        sizes: existing.sizes.join(", "),
        variants: existing.variants,
        quantity_offers: existing.quantity_offers,
        video_url: existing.video_url ?? "",
        featured: existing.featured,
        status: existing.status,
      });
      setImages(existing.product_images ?? []);
    }
  }, [existing]);

  const priceNum = Number(form.price);
  const priceValid = form.price.trim() !== "" && Number.isFinite(priceNum) && priceNum > 0;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name_fr: form.name_fr,
        name_ar: form.name_ar,
        description_fr: form.description_fr || null,
        description_ar: form.description_ar || null,
        details_fr: form.details_fr.split("\n").map((s) => s.trim()).filter(Boolean),
        details_ar: form.details_ar.split("\n").map((s) => s.trim()).filter(Boolean),
        price: Number(form.price),
        compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
        category_id: form.category_id || null,
        stock: Number(form.stock),
        style_code: form.style_code || null,
        colors: sanitizeColors(form.colors),
        sizes: form.sizes.split(",").map((s) => s.trim()).filter(Boolean),
        variants: sanitizeVariantGroups(form.variants),
        quantity_offers: sanitizeOffers(form.quantity_offers),
        video_url: form.video_url || null,
        featured: form.featured,
        status: form.status,
      };

      if (isNew) {
        const slug = await uniqueSlug(form.name_fr, async (candidate) => {
          const { data } = await supabase
            .from("products")
            .select("id")
            .eq("slug", candidate)
            .maybeSingle();
          return !!data;
        });
        const { data: inserted, error } = await supabase
          .from("products")
          .insert({ ...payload, slug })
          .select()
          .single();
        if (error) throw error;
        return inserted.id as string;
      }

      const { error } = await supabase.from("products").update(payload).eq("id", id);
      if (error) throw error;
      return id as string;
    },
    onSuccess: (productId) => {
      // One product lives under several query keys — invalidate the storefront
      // caches too, or the site keeps serving the old price this session.
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast(t("admin.saved"));
      if (isNew) navigate(`/admin/products/${productId}`, { replace: true });
    },
    onError: () => toast(t("admin.saveError"), "error"),
  });

  const handleImageUpload = async (files: FileList) => {
    if (isNew) {
      toast(t("admin.products.saveFirst"), "error");
      return;
    }
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const compressed = await compressImage(file);
        const path = `products/${id}/${crypto.randomUUID()}-${slugify(compressed.name)}`;
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(path, compressed, { cacheControl: "31536000" });
        if (uploadError) throw uploadError;
        const { data: publicUrl } = supabase.storage.from("product-images").getPublicUrl(path);
        const { data: inserted, error: insertError } = await supabase
          .from("product_images")
          .insert({ product_id: id, url: publicUrl.publicUrl, sort_order: images.length })
          .select()
          .single();
        if (insertError) throw insertError;
        setImages((prev) => [...prev, inserted as ProductImage]);
      }
    } catch {
      toast(t("admin.uploadError"), "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    const { error } = await supabase.from("product_images").delete().eq("id", imageId);
    if (error) {
      toast(t("admin.deleteError"), "error");
      return;
    }
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  // The first image is the one snapshotted into every order and used as the
  // shop-card thumbnail, so order matters — persist it via sort_order.
  const moveImage = async (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setImages(next);
    const results = await Promise.all(
      next.map((img, i) =>
        supabase.from("product_images").update({ sort_order: i }).eq("id", img.id),
      ),
    );
    if (results.some((r) => r.error)) {
      toast(t("admin.saveError"), "error");
      setImages(images); // revert to the pre-move order
    } else {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    }
  };

  // A failed load must BLOCK the form — never fall through to blank defaults,
  // or the next Save writes those blanks over a real product.
  if (loadFailed) {
    return (
      <div className="max-w-3xl">
        <p className="rounded-2xl border-2 border-brand/30 bg-brand/5 px-4 py-3 text-sm font-bold text-brand">
          {t("admin.loadError")}
        </p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/products")}>
          {t("admin.cancel")}
        </Button>
      </div>
    );
  }

  if (!isNew && loadingExisting) {
    return <p className="text-muted">{t("common.loading")}</p>;
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-extrabold text-ink">
        {isNew ? t("admin.products.new") : form.name_fr}
      </h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
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
        <Textarea
          placeholder={"Détails (une ligne par point) FR"}
          value={form.details_fr}
          onChange={(e) => setForm({ ...form, details_fr: e.target.value })}
        />
        <Textarea
          placeholder={"مواصفات (سطر لكل نقطة) AR"}
          dir="rtl"
          value={form.details_ar}
          onChange={(e) => setForm({ ...form, details_ar: e.target.value })}
        />

        <Input
          type="number"
          min={0}
          step="0.01"
          placeholder={t("admin.products.price")}
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />
        <Input
          type="number"
          min={0}
          step="0.01"
          placeholder={t("product.compareAt")}
          value={form.compare_at_price}
          onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })}
        />
        <Input
          type="number"
          min={0}
          placeholder={t("admin.products.stock")}
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: e.target.value })}
        />
        <Select
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
        >
          <option value="">{t("shop.filter.all")}</option>
          {orderedCategories.map(({ node, depth }) => (
            <option key={node.id} value={node.id}>
              {"— ".repeat(depth)}
              {node.name_fr}
            </option>
          ))}
        </Select>

        <Input
          placeholder="Tailles (séparées par virgule)"
          value={form.sizes}
          onChange={(e) => setForm({ ...form, sizes: e.target.value })}
        />
        <Input
          placeholder="Code style"
          value={form.style_code}
          onChange={(e) => setForm({ ...form, style_code: e.target.value })}
        />
        <Input
          placeholder="URL vidéo (optionnel)"
          value={form.video_url}
          onChange={(e) => setForm({ ...form, video_url: e.target.value })}
        />

        <Select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as ProductStatus })}
        >
          <option value="draft">{t("admin.products.draft")}</option>
          <option value="active">{t("admin.products.active")}</option>
        </Select>
        <label className="flex items-center gap-2 rounded-xl border-2 border-line px-4 py-2.5">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setForm({ ...form, featured: e.target.checked })}
          />
          <span className="text-sm font-bold text-ink">Featured</span>
        </label>
      </div>

      <div className="mt-8">
        <p className="mb-3 text-sm font-bold text-ink">{t("admin.products.colors")}</p>
        <ColorsEditor
          value={form.colors}
          onChange={(colors) => setForm({ ...form, colors })}
          productId={isNew ? undefined : id}
        />
      </div>

      <div className="mt-8">
        <p className="mb-3 text-sm font-bold text-ink">{t("admin.products.customVariants")}</p>
        <CustomVariantsEditor
          value={form.variants}
          onChange={(variants) => setForm({ ...form, variants })}
          productId={isNew ? undefined : id}
        />
      </div>

      <div className="mt-8">
        <p className="mb-3 text-sm font-bold text-ink">{t("admin.products.quantityOffers")}</p>
        <OffersEditor
          value={form.quantity_offers}
          onChange={(quantity_offers) => setForm({ ...form, quantity_offers })}
        />
      </div>

      {!isNew && (
        <div className="mt-6">
          <p className="mb-2 text-sm font-bold text-ink">
            {t("admin.products.imagesLabel")}
          </p>
          <div className="flex flex-wrap gap-3">
            {images.map((img, i) => (
              <div key={img.id} className="group relative h-24 w-24 overflow-hidden rounded-xl border-2 border-line">
                <SmartImage
                  src={img.url}
                  alt=""
                  width={96}
                  height={96}
                  sizes="96px"
                  className="h-full w-full object-cover"
                />
                {i === 0 && (
                  <span className="absolute start-1 top-1 flex items-center gap-0.5 rounded bg-brand px-1 py-0.5 text-[9px] font-extrabold text-brand-ink">
                    <Star className="h-2.5 w-2.5 fill-current" />
                    {t("admin.products.primaryImage")}
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-ink/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => moveImage(i, i - 1)}
                    disabled={i === 0}
                    aria-label={t("admin.products.moveImageBack")}
                    className="p-1 text-white disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(img.id)}
                    aria-label={t("admin.delete")}
                    className="p-1 text-white hover:text-brand"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(i, i + 1)}
                    disabled={i === images.length - 1}
                    aria-label={t("admin.products.moveImageForward")}
                    className="p-1 text-white disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line text-muted hover:border-blue hover:text-blue">
              <Upload className="h-5 w-5" />
              <span className="text-xs">{uploading ? "…" : "Upload"}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={uploading}
                className="hidden"
                onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
              />
            </label>
          </div>
        </div>
      )}

      {!priceValid && (
        <p className="mt-6 text-sm font-bold text-brand">{t("admin.products.priceRequired")}</p>
      )}
      <div className="mt-4 flex gap-2">
        <Button
          variant="brand"
          disabled={saveMutation.isPending || !form.name_fr.trim() || !priceValid}
          onClick={() => saveMutation.mutate()}
        >
          {saveMutation.isPending ? t("admin.saving") : t("admin.save")}
        </Button>
        <Button variant="outline" onClick={() => navigate("/admin/products")}>
          {t("admin.cancel")}
        </Button>
      </div>
    </div>
  );
}
