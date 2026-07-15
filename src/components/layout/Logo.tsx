import { PawPrint } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  const { t } = useLanguage();
  return (
    <Link
      to="/"
      className={cn("group flex items-center gap-2 shrink-0", className)}
      aria-label="KINDO"
    >
      <span className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-brand text-brand-ink shadow-[0_3px_0_0_rgb(var(--c-ink)/0.15)] transition-transform group-hover:-rotate-6">
        <PawPrint className="h-5 w-5" strokeWidth={2.5} />
        <span className="absolute -end-1 -top-1 h-3 w-3 rounded-full bg-yellow ring-2 ring-panel" />
      </span>
      <span className="font-display text-2xl font-extrabold tracking-tight text-ink">
        {t("brand.name")}
      </span>
    </Link>
  );
}
