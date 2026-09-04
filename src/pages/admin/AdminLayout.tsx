import { Suspense, useEffect, useState } from "react";
import { Link, Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, LogOut, Menu, Moon, ShieldAlert, Sun, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminProfile } from "@/hooks/useAdminProfile";
import { ADMIN_SECTIONS, routeToSection, type AdminSection } from "@/lib/adminSections";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useTheme } from "@/theme/ThemeProvider";
import { Logo } from "@/components/layout/Logo";
import { AdminToastProvider } from "@/components/admin/AdminToast";
import { cn } from "@/lib/utils";

// MODULE scope — a component redefined every render gets a new identity and
// React remounts the whole drawer subtree, which swaps a button out mid-tap.
function SidebarContent({
  sections,
  onNavigate,
}: {
  sections: AdminSection[];
  onNavigate?: () => void;
}) {
  const { t, dir } = useLanguage();
  const { signOut } = useAuth();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 px-5 py-5">
        <Logo size="lg" />
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3">
        {sections.map(({ key, route, exact, labelKey, icon: Icon }) => (
          <NavLink
            key={key}
            to={route}
            end={exact}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors",
                isActive ? "bg-brand text-brand-ink" : "text-ink hover:bg-panel-2",
              )
            }
          >
            <Icon className="h-4.5 w-4.5" />
            {t(labelKey)}
          </NavLink>
        ))}
      </nav>
      <div className="shrink-0 border-t-2 border-line p-3">
        <SidebarFooter />
        <Link
          to="/"
          onClick={onNavigate}
          className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-ink hover:bg-panel-2"
        >
          <ArrowLeft className={cn("h-4.5 w-4.5", dir === "rtl" && "rotate-180")} />
          {t("admin.nav.backToSite")}
        </Link>
        <button
          onClick={() => signOut()}
          className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-brand hover:bg-brand/10"
        >
          <LogOut className="h-4.5 w-4.5" />
          {t("admin.nav.logout")}
        </button>
      </div>
    </div>
  );
}

function SidebarFooter() {
  const { lang, setLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setLang(lang === "fr" ? "ar" : "fr")}
        className="flex-1 rounded-xl bg-panel-2 px-3 py-2 text-xs font-bold text-ink"
      >
        {lang === "fr" ? "AR" : "FR"}
      </button>
      <button
        onClick={toggleTheme}
        className="flex-1 rounded-xl bg-panel-2 px-3 py-2 text-xs font-bold text-ink"
        aria-label={t("common.theme")}
      >
        {theme === "light" ? <Moon className="mx-auto h-4 w-4" /> : <Sun className="mx-auto h-4 w-4" />}
      </button>
    </div>
  );
}

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-muted">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-line border-t-brand" />
    </div>
  );
}

export default function AdminLayout() {
  const { isAuthenticated, loading, signOut } = useAuth();
  const { isOwner, isActive, hasSection, isLoading: profileLoading } = useAdminProfile();
  const { t, dir } = useLanguage();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => mq.matches && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onChange);
    return () => {
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onChange);
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const y = window.scrollY;
    const { body } = document;
    body.style.position = "fixed";
    body.style.top = `-${y}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
    return () => {
      body.style.position = "";
      body.style.top = "";
      body.style.width = "";
      body.style.overflow = "";
      window.scrollTo(0, y);
    };
  }, [mobileOpen]);

  // 1. Hold the loading screen while the profile is still resolving — the first
  //    render has no profile yet and would bounce a legitimate worker.
  if (loading || (isAuthenticated && profileLoading)) {
    return <div className="flex min-h-screen items-center justify-center text-muted">…</div>;
  }

  // 2. No session.
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // 3. Session but no active admin_profiles row (deactivated, or self-registered) —
  //    a real "no access" screen with a way out, never an empty dashboard.
  if (!isActive) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-panel-2 px-4 text-center">
        <ShieldAlert className="h-12 w-12 text-brand" />
        <h1 className="font-display text-xl font-extrabold text-ink">{t("admin.noAccess.title")}</h1>
        <p className="max-w-sm text-sm text-muted">{t("admin.noAccess.body")}</p>
        <button
          onClick={() => signOut()}
          className="rounded-full bg-brand px-5 py-2 text-sm font-bold text-brand-ink"
        >
          {t("admin.nav.logout")}
        </button>
      </div>
    );
  }

  const canAccess = (s: AdminSection) =>
    s.always || (s.ownerOnly ? isOwner : hasSection(s.key));
  const visibleSections = ADMIN_SECTIONS.filter(canAccess);

  // 5. Direct-URL guard — same predicate. The dashboard is always:true so the
  //    redirect target is never itself forbidden (no loop).
  const currentKey = routeToSection(pathname);
  if (currentKey) {
    const section = ADMIN_SECTIONS.find((s) => s.key === currentKey);
    if (section && !canAccess(section)) {
      return <Navigate to="/admin" replace />;
    }
  }

  return (
    <div className="min-h-screen bg-panel-2">
      <aside className="fixed inset-y-0 start-0 hidden w-64 border-e-2 border-line bg-panel lg:block">
        <SidebarContent sections={visibleSections} />
      </aside>

      <div className="flex items-center justify-between border-b-2 border-line bg-panel px-4 py-3 lg:hidden">
        <Logo size="lg" />
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-full p-2 text-ink hover:bg-panel-2"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="fixed inset-y-0 start-0 z-50 flex w-72 flex-col overflow-hidden bg-panel shadow-2xl lg:hidden"
              initial={{ x: dir === "rtl" ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: dir === "rtl" ? "100%" : "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
            >
              <div className="flex shrink-0 justify-end p-3">
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="-m-2 rounded-full p-2 text-muted hover:bg-panel-2"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1">
                <SidebarContent sections={visibleSections} onNavigate={() => setMobileOpen(false)} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="px-4 py-6 sm:px-6 lg:ms-64 lg:px-8 lg:py-8">
        <AdminToastProvider>
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </AdminToastProvider>
      </main>
    </div>
  );
}
