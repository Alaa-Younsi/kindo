import { useState } from "react";
import { Navigate } from "react-router-dom";
import { PawPrint } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function AdminLogin() {
  const { t } = useLanguage();
  const { isAuthenticated, loading, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err) {
      if (import.meta.env.DEV) console.error("[admin login]", err);
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-panel-2 px-4">
      <div className="w-full max-w-sm rounded-3xl border-2 border-line bg-panel p-8 shadow-lg">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-brand-ink">
          <PawPrint className="h-6 w-6" />
        </div>
        <h1 className="text-center font-display text-xl font-extrabold text-ink">
          {t("admin.login.title")}
        </h1>
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <Input
            type="email"
            placeholder={t("admin.login.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder={t("admin.login.password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm font-bold text-brand">{t("admin.login.error")}</p>}
          <Button type="submit" variant="brand" size="lg" disabled={submitting} className="w-full">
            {t("admin.login.submit")}
          </Button>
        </form>
      </div>
    </div>
  );
}
