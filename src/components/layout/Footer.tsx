import { Link } from "react-router-dom";
import { MapPin, Phone } from "lucide-react";
import { Logo } from "./Logo";
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

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t-2 border-line bg-panel-2">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">{t("footer.about")}</p>
          <div className="mt-4 flex gap-3">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-blue text-blue-ink transition-transform hover:-translate-y-0.5"
            >
              <FacebookIcon className="h-4 w-4" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-brand-ink transition-transform hover:-translate-y-0.5"
            >
              <InstagramIcon className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-display text-sm font-extrabold uppercase tracking-wide text-ink">
            {t("footer.links")}
          </h3>
          <ul className="flex flex-col gap-2 text-sm text-muted">
            <li>
              <Link to="/" className="transition-colors hover:text-brand">
                {t("nav.home")}
              </Link>
            </li>
            <li>
              <Link to="/shop" className="transition-colors hover:text-brand">
                {t("nav.shop")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 font-display text-sm font-extrabold uppercase tracking-wide text-ink">
            {t("footer.contact")}
          </h3>
          <ul className="flex flex-col gap-2 text-sm text-muted">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-green" />
              <span dir="ltr">+213 555 00 00 00</span>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green" />
              <span>Algérie</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t-2 border-line px-4 py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} KINDO. {t("footer.rights")}
      </div>
    </footer>
  );
}
