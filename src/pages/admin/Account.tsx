import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useAdminProfile } from "@/hooks/useAdminProfile";
import { useStoreSettings, useUpdateStoreSettings } from "@/hooks/useStoreSettings";
import { useAdminToast } from "@/components/admin/AdminToast";
import { useLanguage } from "@/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { TranslationKey } from "@/i18n/translations";

function mapPwError(message: string): TranslationKey {
  const m = message.toLowerCase();
  if (m.includes("should be different") || m.includes("different from the old")) {
    return "admin.account.err.sameAsOld";
  }
  if (m.includes("at least") || m.includes("too short") || m.includes("weak")) {
    return "admin.account.err.tooShort";
  }
  return "admin.account.err.generic";
}

export default function Account() {
  const { t } = useLanguage();
  const { toast } = useAdminToast();
  const { session } = useAuth();
  const { isOwner } = useAdminProfile();
  const email = session?.user.email ?? "";

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 8) return toast(t("admin.account.err.tooShort"), "error");
    if (next !== confirm) return toast(t("admin.account.err.mismatch"), "error");

    setPwBusy(true);
    try {
      // Re-authenticate first — updateUser acts on whatever session is live, so
      // an unattended open dashboard is otherwise enough to lock the owner out.
      const { error: reauth } = await supabase.auth.signInWithPassword({
        email,
        password: current,
      });
      if (reauth) {
        toast(t("admin.account.err.wrongCurrent"), "error");
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) {
        toast(t(mapPwError(error.message)), "error");
        return;
      }
      toast(t("admin.account.pwUpdated"));
      setCurrent("");
      setNext("");
      setConfirm("");
    } finally {
      setPwBusy(false);
    }
  };

  // --- website settings (owner-visible; RLS allows any active admin) ---
  const { data: settings } = useStoreSettings();
  const updateSettings = useUpdateStoreSettings();
  const [freeShip, setFreeShip] = useState("");
  const [baseShip, setBaseShip] = useState("");

  useEffect(() => {
    if (!settings) return;
    setFreeShip(settings.free_ship_threshold != null ? String(settings.free_ship_threshold) : "");
    setBaseShip(String(settings.shipping_fee ?? ""));
  }, [settings]);

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate(
      {
        free_ship_threshold: freeShip.trim() === "" ? null : Number(freeShip),
        shipping_fee: baseShip.trim() === "" ? 0 : Number(baseShip),
      },
      {
        onSuccess: () => toast(t("admin.account.settingsSaved")),
        onError: () => toast(t("admin.saveError"), "error"),
      },
    );
  };

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-extrabold text-ink">{t("admin.account.title")}</h1>

      <div className="mt-4 rounded-2xl border-2 border-line bg-panel p-4 text-sm">
        <span className="text-muted">{t("admin.account.signedInAs")}</span>{" "}
        <span className="font-bold text-ink" dir="ltr">
          {email}
        </span>
        <span
          className={`ms-2 rounded-full px-2 py-0.5 text-xs font-extrabold ${
            isOwner ? "bg-brand/15 text-brand" : "bg-blue/15 text-blue"
          }`}
        >
          {isOwner ? t("admin.team.owner") : t("admin.team.worker")}
        </span>
      </div>

      <form onSubmit={changePassword} className="mt-6 space-y-3">
        <h2 className="font-display text-lg font-extrabold text-ink">{t("admin.account.pwSection")}</h2>
        <Input
          type="password"
          autoComplete="current-password"
          placeholder={t("admin.account.current")}
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
        />
        <Input
          type="password"
          autoComplete="new-password"
          placeholder={t("admin.account.new")}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
        />
        <Input
          type="password"
          autoComplete="new-password"
          placeholder={t("admin.account.confirm")}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <Button type="submit" variant="brand" size="sm" disabled={pwBusy}>
          {pwBusy ? t("admin.saving") : t("admin.account.pwSubmit")}
        </Button>
      </form>

      <form onSubmit={saveSettings} className="mt-10 space-y-3">
        <h2 className="font-display text-lg font-extrabold text-ink">
          {t("admin.account.settingsSection")}
        </h2>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
            {t("admin.account.freeShip")}
          </label>
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            value={freeShip}
            onChange={(e) => setFreeShip(e.target.value)}
            placeholder="—"
          />
          <p className="mt-1 text-xs text-muted">{t("admin.account.freeShipHint")}</p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
            {t("admin.account.baseShip")}
          </label>
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            value={baseShip}
            onChange={(e) => setBaseShip(e.target.value)}
          />
        </div>
        <Button type="submit" variant="brand" size="sm" disabled={updateSettings.isPending}>
          {updateSettings.isPending ? t("admin.saving") : t("admin.save")}
        </Button>
      </form>
    </div>
  );
}
