import { Link } from "react-router-dom";
import { MapPin, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { Paw } from "@/components/effects/PawScatter";
import { WaveDivider } from "@/components/effects/WaveDivider";
import { useLanguage } from "@/i18n/LanguageProvider";

// lucide-react dropped brand/logo glyphs — hand-drawn paths for the two
// social icons, the one case the icon library genuinely has no shape for.
function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.89h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ColumnHeading({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-wide text-ink">
      <span aria-hidden className={`h-4 w-1.5 rounded-full ${tone}`} />
      {children}
    </h3>
  );
}

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="relative">
      <WaveDivider flip className="text-panel-2 -mb-1" />
      <div className="bg-tint-footer bg-paws relative overflow-hidden">
        {/* giant paw watermark */}
        <Paw className="pointer-events-none absolute -bottom-16 -end-10 h-64 w-64 rotate-[-18deg] text-ink/5" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">{t("footer.about")}</p>
            <div className="mt-4 flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-blue text-blue-ink shadow-[0_3px_0_0_rgb(var(--c-ink)/0.15)] transition-transform hover:-translate-y-1 hover:rotate-6"
              >
                <FacebookIcon className="h-4.5 w-4.5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-brand-ink shadow-[0_3px_0_0_rgb(var(--c-ink)/0.15)] transition-transform hover:-translate-y-1 hover:-rotate-6"
              >
                <InstagramIcon className="h-4.5 w-4.5" />
              </a>
            </div>
          </div>

          <div>
            <ColumnHeading tone="bg-blue">{t("footer.links")}</ColumnHeading>
            <ul className="flex flex-col gap-2 text-sm text-muted">
              <li>
                <Link to="/" className="group flex items-center gap-2 transition-colors hover:text-brand">
                  <Paw className="h-3 w-3 text-brand/40 transition-transform group-hover:rotate-12 group-hover:text-brand" />
                  {t("nav.home")}
                </Link>
              </li>
              <li>
                <Link to="/shop" className="group flex items-center gap-2 transition-colors hover:text-blue">
                  <Paw className="h-3 w-3 text-blue/40 transition-transform group-hover:rotate-12 group-hover:text-blue" />
                  {t("nav.shop")}
                </Link>
              </li>
              <li>
                <Link
                  to="/admin"
                  className="group flex items-center gap-2 transition-colors hover:text-green"
                >
                  <Paw className="h-3 w-3 text-green/40 transition-transform group-hover:rotate-12 group-hover:text-green" />
                  {t("nav.admin")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <ColumnHeading tone="bg-green">{t("footer.contact")}</ColumnHeading>
            <ul className="flex flex-col gap-2 text-sm text-muted">
              <li className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green/15 text-green">
                  <Phone className="h-3.5 w-3.5" />
                </span>
                <span dir="ltr">+213 555 00 00 00</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/15 text-brand">
                  <MapPin className="h-3.5 w-3.5" />
                </span>
                <span>Algérie</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="relative border-t-2 border-line/60 px-4 py-4 text-center text-xs text-muted">
          © {new Date().getFullYear()} KINDO. {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}
