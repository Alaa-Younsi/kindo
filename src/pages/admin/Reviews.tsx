import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Star, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useLanguage } from "@/i18n/LanguageProvider";
import { compressImage } from "@/lib/image";
import { slugify } from "@/lib/utils";
import type { ClientReview } from "@/types/db";

interface FormState {
  client_name: string;
  stars: number;
  review_text: string;
  image_url: string | null;
}

const EMPTY_FORM: FormState = { client_name: "", stars: 5, review_text: "", image_url: null };

function useAllReviews() {
  return useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: async (): Promise<ClientReview[]> => {
      const { data, error } = await supabase
        .from("client_reviews")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export default function AdminReviews() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { data: reviews, isLoading } = useAllReviews();
  const [form, setForm] = useState<FormState | null>(null);
  const [uploading, setUploading] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async (values: FormState) => {
      const { error } = await supabase.from("client_reviews").insert({
        client_name: values.client_name,
        stars: values.stars,
        review_text: values.review_text,
        image_url: values.image_url,
        active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      setForm(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("client_reviews").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("client_reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const path = `reviews/${crypto.randomUUID()}-${slugify(compressed.name)}`;
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

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-ink">{t("admin.reviews.title")}</h1>
        <Button variant="brand" size="sm" onClick={() => setForm(EMPTY_FORM)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          {t("admin.add")}
        </Button>
      </div>

      {form && (
        <div className="mt-4 rounded-2xl border-2 border-brand/30 bg-brand/5 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder={t("admin.reviews.name")}
              value={form.client_name}
              onChange={(e) => setForm({ ...form, client_name: e.target.value })}
            />
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setForm({ ...form, stars: n })} type="button">
                  <Star
                    className={`h-6 w-6 ${n <= form.stars ? "fill-yellow text-yellow" : "text-line"}`}
                  />
                </button>
              ))}
            </div>
          </div>
          <Textarea
            className="mt-3"
            placeholder={t("admin.reviews.text")}
            value={form.review_text}
            onChange={(e) => setForm({ ...form, review_text: e.target.value })}
          />
          <div className="mt-3 flex items-center gap-3">
            {form.image_url && (
              <img
                src={form.image_url}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
              />
            )}
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
              className="text-sm text-muted"
            />
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

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {!isLoading &&
          reviews?.map((review) => (
            <div
              key={review.id}
              className={`rounded-2xl border-2 border-line bg-panel p-4 ${!review.active ? "opacity-50" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${i < review.stars ? "fill-yellow text-yellow" : "text-line"}`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => deleteMutation.mutate(review.id)}
                  className="text-brand hover:text-brand/70"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-ink">{review.review_text}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-bold text-muted">{review.client_name}</span>
                <label className="flex items-center gap-1.5 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={review.active}
                    onChange={(e) =>
                      toggleMutation.mutate({ id: review.id, active: e.target.checked })
                    }
                  />
                  {t("admin.delivery.active")}
                </label>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
