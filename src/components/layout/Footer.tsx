import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
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

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.529 5.283l-.999 3.648 3.65-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
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
              <li>
                <a
                  href="https://wa.me/213542360763"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 font-semibold text-ink transition-colors hover:text-green"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green text-white shadow-[0_2px_0_0_rgb(var(--c-ink)/0.15)] transition-transform group-hover:-translate-y-0.5 group-hover:-rotate-6">
                    <WhatsAppIcon className="h-4 w-4" />
                  </span>
                  <span dir="ltr">+213 542 36 07 63</span>
                </a>
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
