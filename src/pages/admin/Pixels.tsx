import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  useAllPixelsAdmin,
  useDeletePixel,
  useSavePixel,
  type PixelDraft,
} from "@/hooks/useTrackingPixels";
import type { PixelEventKey, PixelProvider, TrackingPixel } from "@/lib/tracking";
import { useAdminToast } from "@/components/admin/AdminToast";
import { useLanguage } from "@/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { TranslationKey } from "@/i18n/translations";

const EVENT_KEYS: PixelEventKey[] = [
  "page_view",
  "view_content",
  "add_to_cart",
  "initiate_checkout",
  "purchase",
];
const EVENT_LABEL: Record<PixelEventKey, TranslationKey> = {
  page_view: "admin.pixels.evPageView",
  view_content: "admin.pixels.evViewContent",
  add_to_cart: "admin.pixels.evAddToCart",
  initiate_checkout: "admin.pixels.evInitiateCheckout",
  purchase: "admin.pixels.evPurchase",
};

// Meta: 15-16 digits. TikTok: alphanumeric pixel code. Reject a full-snippet paste.
const PIXEL_ID_RE = /^[\w.-]{6,40}$/;

function blankDraft(): PixelDraft {
  return {
    provider: "meta",
    label: "",
    pixel_id: "",
    active: true,
    scope: "all",
    match_values: [],
    events: {
      page_view: true,
      view_content: true,
      add_to_cart: true,
      initiate_checkout: true,
      purchase: true,
    },
    currency: "DZD",
    sort_order: 0,
    notes: null,
  };
}

function PixelForm({
  initial,
  onDone,
}: {
  initial: PixelDraft;
  onDone: () => void;
}) {
  const { t } = useLanguage();
  const { toast } = useAdminToast();
  const save = useSavePixel();
  const [draft, setDraft] = useState<PixelDraft>(initial);
  const [matchText, setMatchText] = useState(initial.match_values.join("\n"));

  const set = <K extends keyof PixelDraft>(k: K, v: PixelDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const submit = () => {
    if (!draft.label.trim()) return toast(t("admin.saveError"), "error");
    if (!PIXEL_ID_RE.test(draft.pixel_id.trim())) {
      return toast(t("admin.pixels.pixelIdInvalid"), "error");
    }
    const match_values =
      draft.scope === "paths"
        ? matchText.split("\n").map((s) => s.trim()).filter(Boolean)
        : [];
    save.mutate(
      { ...draft, match_values },
      {
        onSuccess: () => {
          toast(t("admin.saved"));
          onDone();
        },
        onError: () => toast(t("admin.saveError"), "error"),
      },
    );
  };

  return (
    <div className="space-y-3 rounded-2xl border-2 border-brand/30 bg-brand/5 p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
            {t("admin.pixels.provider")}
          </label>
          <Select
            value={draft.provider}
            onChange={(e) => set("provider", e.target.value as PixelProvider)}
          >
            <option value="meta">{t("admin.pixels.providerMeta")}</option>
            <option value="tiktok">{t("admin.pixels.providerTiktok")}</option>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
            {t("admin.pixels.label")}
          </label>
          <Input
            value={draft.label}
            placeholder={t("admin.pixels.labelPlaceholder")}
            onChange={(e) => set("label", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
          {t("admin.pixels.pixelId")}
        </label>
        <Input value={draft.pixel_id} dir="ltr" onChange={(e) => set("pixel_id", e.target.value)} />
        <p className="mt-1 text-xs text-muted">
          {draft.provider === "meta"
            ? t("admin.pixels.pixelIdHintMeta")
            : t("admin.pixels.pixelIdHintTiktok")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
            {t("admin.pixels.scope")}
          </label>
          <Select
            value={draft.scope}
            onChange={(e) => set("scope", e.target.value as "all" | "paths")}
          >
            <option value="all">{t("admin.pixels.scopeAll")}</option>
            <option value="paths">{t("admin.pixels.scopePaths")}</option>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
            {t("admin.pixels.sortOrder")}
          </label>
          <Input
            type="number"
            value={draft.sort_order}
            onChange={(e) => set("sort_order", Number(e.target.value) || 0)}
          />
        </div>
      </div>

      {draft.scope === "paths" && (
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
            {t("admin.pixels.matchValues")}
          </label>
          <Textarea
            rows={3}
            dir="ltr"
            value={matchText}
            onChange={(e) => setMatchText(e.target.value)}
          />
          <p className="mt-1 text-xs text-muted">{t("admin.pixels.matchHint")}</p>
        </div>
      )}

      <div>
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">
          {t("admin.pixels.events")}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {EVENT_KEYS.map((k) => (
            <label
              key={k}
              className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-line px-3 py-2 text-sm font-bold has-[:checked]:border-brand has-[:checked]:bg-brand/5"
            >
              <input
                type="checkbox"
                checked={draft.events[k]}
                onChange={(e) => set("events", { ...draft.events, [k]: e.target.checked })}
              />
              {t(EVENT_LABEL[k])}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
            {t("admin.pixels.currency")}
          </label>
          <Input value={draft.currency} onChange={(e) => set("currency", e.target.value)} />
        </div>
        <label className="flex items-center gap-2 self-end rounded-xl border-2 border-line px-4 py-2.5 text-sm font-bold">
          <input
            type="checkbox"
            checked={draft.active}
            onChange={(e) => set("active", e.target.checked)}
          />
          {t("admin.pixels.active")}
        </label>
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
          {t("admin.pixels.notes")}
        </label>
        <Textarea
          rows={2}
          value={draft.notes ?? ""}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Button variant="brand" size="sm" disabled={save.isPending} onClick={submit}>
          {save.isPending ? t("admin.saving") : t("admin.save")}
        </Button>
        <Button variant="outline" size="sm" onClick={onDone}>
          {t("admin.cancel")}
        </Button>
      </div>
    </div>
  );
}

export default function Pixels() {
  const { t } = useLanguage();
  const { toast } = useAdminToast();
  const { data: pixels, isLoading } = useAllPixelsAdmin();
  const del = useDeletePixel();
  const [editing, setEditing] = useState<PixelDraft | null>(null);
  const [adding, setAdding] = useState(false);

  const remove = (p: TrackingPixel) => {
    if (!confirm(t("admin.pixels.deleteConfirm"))) return;
    del.mutate(p.id, {
      onSuccess: () => toast(t("admin.saved")),
      onError: () => toast(t("admin.deleteError"), "error"),
    });
  };

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">{t("admin.pixels.title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("admin.pixels.subtitle")}</p>
        </div>
        {!adding && !editing && (
          <Button variant="brand" size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" />
            {t("admin.pixels.add")}
          </Button>
        )}
      </div>

      {(adding || editing) && (
        <div className="mt-4">
          <PixelForm
            initial={editing ?? blankDraft()}
            onDone={() => {
              setAdding(false);
              setEditing(null);
            }}
          />
        </div>
      )}

      <div className="mt-6 space-y-3">
        {!isLoading && pixels?.length === 0 && (
          <p className="text-sm text-muted">{t("admin.pixels.empty")}</p>
        )}
        {pixels?.map((p) => (
          <div
            key={p.id}
            className={`rounded-2xl border-2 border-line bg-panel p-4 ${!p.active ? "opacity-60" : ""}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${
                    p.provider === "meta" ? "bg-blue/15 text-blue" : "bg-ink/10 text-ink"
                  }`}
                >
                  {p.provider === "meta" ? "Meta" : "TikTok"}
                </span>
                <span className="font-bold text-ink">{p.label}</span>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setEditing({ ...p })}>
                  {t("admin.edit")}
                </Button>
                <button
                  onClick={() => remove(p)}
                  aria-label={t("admin.delete")}
                  className="rounded-lg p-2 text-muted hover:bg-brand/10 hover:text-brand"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="mt-1 font-mono text-xs text-muted" dir="ltr">
              {p.pixel_id}
            </p>
            <p className="mt-1 text-xs text-muted">
              {p.scope === "all"
                ? t("admin.pixels.scopeAll")
                : `${t("admin.pixels.scopePaths")} · ${p.match_values.length || "∗"}`}{" "}
              ·{" "}
              {EVENT_KEYS.filter((k) => p.events[k])
                .map((k) => t(EVENT_LABEL[k]))
                .join(", ")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
