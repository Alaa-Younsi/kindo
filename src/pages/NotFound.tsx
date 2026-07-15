import { Link } from "react-router-dom";
import { PawPrint } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useSeo } from "@/hooks/useSeo";

export default function NotFound() {
  const { t } = useLanguage();
  useSeo({ title: t("notFound.title"), description: t("notFound.subtitle") });

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow/20 text-yellow-ink">
        <PawPrint className="h-8 w-8" />
      </div>
      <h1 className="mt-5 font-display text-4xl font-extrabold text-ink">404</h1>
      <p className="mt-2 text-lg font-bold text-ink">{t("notFound.title")}</p>
      <p className="mt-1 text-muted">{t("notFound.subtitle")}</p>
      <Link to="/">
        <Button variant="brand" size="lg" className="mt-6">
          {t("notFound.cta")}
        </Button>
      </Link>
    </div>
  );
}
