import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { GRANTABLE_SECTIONS } from "@/lib/adminSections";
import { useAdminToast } from "@/components/admin/AdminToast";
import { useLanguage } from "@/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { AdminProfileRow } from "@/types/db";
import type { TranslationKey } from "@/i18n/translations";

const KNOWN_CODES = new Set([
  "email_exists",
  "weak_password",
  "bad_email",
  "forbidden",
  "not_found",
  "forbidden_target",
]);

/** supabase.functions.invoke throws a FunctionsHttpError whose body is NOT on
 *  error.message — it's a Response on `.context`. Pull the {code} out. */
async function readFnError(error: unknown): Promise<TranslationKey> {
  const ctx = (error as { context?: Response }).context;
  if (ctx && typeof ctx.json === "function") {
    try {
      const body = await ctx.json();
      if (body?.code && KNOWN_CODES.has(body.code)) {
        return `admin.team.err.${body.code}` as TranslationKey;
      }
    } catch {
      /* not json */
    }
  }
  return "admin.team.err.generic";
}

function useWorkers() {
  return useQuery({
    queryKey: ["admin", "workers"],
    queryFn: async (): Promise<AdminProfileRow[]> => {
      const { data, error } = await supabase
        .from("admin_profiles")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return ((data as AdminProfileRow[]) ?? []).filter((w) => !w.is_owner);
    },
  });
}

function SectionGrid({
  value,
  onToggle,
}: {
  value: string[];
  onToggle: (key: string) => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {GRANTABLE_SECTIONS.map((s) => (
        <label
          key={s.key}
          className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-line px-3 py-2 text-sm font-bold has-[:checked]:border-brand has-[:checked]:bg-brand/5"
        >
          <input
            type="checkbox"
            checked={value.includes(s.key)}
            onChange={() => onToggle(s.key)}
          />
          {t(s.labelKey)}
        </label>
      ))}
    </div>
  );
}

function WorkerRow({ worker }: { worker: AdminProfileRow }) {
  const { t } = useLanguage();
  const { toast } = useAdminToast();
  const qc = useQueryClient();

  const [sections, setSections] = useState<string[]>(worker.sections);
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState("");
  const dirty = JSON.stringify([...sections].sort()) !== JSON.stringify([...worker.sections].sort());

  const save = useMutation({
    mutationFn: async (patch: Partial<AdminProfileRow>) => {
      const { error } = await supabase
        .from("admin_profiles")
        .update(patch)
        .eq("user_id", worker.user_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "workers"] });
      toast(t("admin.saved"));
    },
    onError: () => toast(t("admin.saveError"), "error"),
  });

  const setPassword = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("set-worker-password", {
        body: { userId: worker.user_id, password: pw },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setPw("");
      setPwOpen(false);
      toast(t("admin.team.passwordSet"));
    },
    onError: async (err) => toast(t(await readFnError(err)), "error"),
  });

  return (
    <div className={`rounded-2xl border-2 border-line bg-panel p-4 ${!worker.active ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-bold text-ink" dir="ltr">
          {worker.email}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${
            worker.active ? "bg-green/15 text-green" : "bg-line/40 text-muted"
          }`}
        >
          {worker.active ? t("admin.team.active") : t("admin.team.inactive")}
        </span>
      </div>

      <div className="mt-3">
        <SectionGrid
          value={sections}
          onToggle={(key) =>
            setSections((prev) =>
              prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
            )
          }
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {dirty && (
          <>
            <Button
              variant="brand"
              size="sm"
              disabled={save.isPending}
              onClick={() => save.mutate({ sections })}
            >
              {t("admin.save")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSections(worker.sections)}>
              {t("admin.cancel")}
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          size="sm"
          disabled={save.isPending}
          onClick={() => save.mutate({ active: !worker.active })}
        >
          {worker.active ? t("admin.team.deactivate") : t("admin.team.activate")}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setPwOpen((v) => !v)}>
          <KeyRound className="h-4 w-4" />
          {t("admin.team.changePassword")}
        </Button>
      </div>

      {pwOpen && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-panel-2 p-3">
          <Input
            type="text"
            autoComplete="off"
            className="max-w-xs"
            placeholder={t("admin.team.newPassword")}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
          <Button
            variant="brand"
            size="sm"
            disabled={pw.length < 8 || setPassword.isPending}
            onClick={() => setPassword.mutate()}
          >
            {t("admin.team.setPassword")}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function Team() {
  const { t } = useLanguage();
  const { toast } = useAdminToast();
  const qc = useQueryClient();
  const { data: workers, isLoading } = useWorkers();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sections, setSections] = useState<string[]>([]);

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("create-worker", {
        body: { email, password, sections },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "workers"] });
      setEmail("");
      setPassword("");
      setSections([]);
      toast(t("admin.team.created"));
    },
    onError: async (err) => toast(t(await readFnError(err)), "error"),
  });

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-extrabold text-ink">{t("admin.team.title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("admin.team.subtitle")}</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="mt-6 space-y-3 rounded-2xl border-2 border-brand/30 bg-brand/5 p-5"
      >
        <h2 className="font-display text-lg font-extrabold text-ink">{t("admin.team.newTitle")}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            type="email"
            autoComplete="off"
            placeholder={t("admin.team.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div>
            <Input
              type="text"
              autoComplete="off"
              placeholder={t("admin.team.password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="mt-1 text-xs text-muted">{t("admin.team.passwordHint")}</p>
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">
            {t("admin.team.sections")}
          </p>
          <SectionGrid
            value={sections}
            onToggle={(key) =>
              setSections((prev) =>
                prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
              )
            }
          />
        </div>
        <Button type="submit" variant="brand" size="sm" disabled={create.isPending || password.length < 8}>
          <UserPlus className="h-4 w-4" />
          {create.isPending ? t("admin.team.creating") : t("admin.team.create")}
        </Button>
      </form>

      <h2 className="mt-8 font-display text-lg font-extrabold text-ink">{t("admin.team.members")}</h2>
      <div className="mt-3 space-y-3">
        {!isLoading && workers?.length === 0 && (
          <p className="text-sm text-muted">{t("admin.team.empty")}</p>
        )}
        {workers?.map((w) => <WorkerRow key={w.user_id} worker={w} />)}
      </div>
    </div>
  );
}
