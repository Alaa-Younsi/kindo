import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { CatMascot } from "@/components/effects/mascots";
import { PawScatter } from "@/components/effects/PawScatter";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useSeo } from "@/hooks/useSeo";

export default function NotFound() {
  const { t } = useLanguage();
  useSeo({ title: t("notFound.title"), description: t("notFound.subtitle") });

  return (
    <div className="bg-mesh-hero relative">
      <PawScatter />
      <div className="relative mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <div className="flex items-end gap-0">
          <span className="font-display text-8xl font-extrabold text-brand">4</span>
          <span className="anim-bounce-soft mx-1 inline-block">
            <CatMascot className="h-28 w-28" />
          </span>
          <span className="font-display text-8xl font-extrabold text-blue">4</span>
        </div>
        <p className="mt-4 text-lg font-extrabold text-ink">{t("notFound.title")}</p>
        <p className="mt-1 text-muted">{t("notFound.subtitle")}</p>
        <Link to="/">
          <Button variant="green" size="lg" className="fx-paw-sweep mt-6 hover:-rotate-1">
            {t("notFound.cta")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
