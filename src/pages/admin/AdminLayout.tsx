import { useState } from "react";
import { Navigate, NavLink, Outlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  ListTree,
  LogOut,
  Menu,
  Moon,
  Package,
  Star,
  Sun,
  Truck,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useTheme } from "@/theme/ThemeProvider";
import { Logo } from "@/components/layout/Logo";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/admin", key: "admin.nav.dashboard", Icon: LayoutDashboard, end: true },
  { to: "/admin/products", key: "admin.nav.products", Icon: Package, end: false },
  { to: "/admin/categories", key: "admin.nav.categories", Icon: ListTree, end: false },
  { to: "/admin/orders", key: "admin.nav.orders", Icon: Truck, end: false },
  { to: "/admin/delivery-prices", key: "admin.nav.delivery", Icon: Truck, end: false },
  { to: "/admin/reviews", key: "admin.nav.reviews", Icon: Star, end: false },
] as const;

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useLanguage();
  const { signOut } = useAuth();

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ to, key, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors",
                isActive ? "bg-brand text-brand-ink" : "text-ink hover:bg-panel-2",
              )
            }
          >
            <Icon className="h-4.5 w-4.5" />
            {t(key)}
          </NavLink>
        ))}
      </nav>
      <div className="border-t-2 border-line p-3">
        <SidebarFooter />
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

export default function AdminLayout() {
  const { isAuthenticated, loading } = useAuth();
  const { dir } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted">…</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-panel-2">
      <aside className="fixed inset-y-0 start-0 hidden w-64 border-e-2 border-line bg-panel lg:block">
        <SidebarContent />
      </aside>

      <div className="flex items-center justify-between border-b-2 border-line bg-panel px-4 py-3 lg:hidden">
        <Logo />
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
              className="fixed inset-y-0 start-0 z-50 w-72 bg-panel shadow-2xl lg:hidden"
              initial={{ x: dir === "rtl" ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: dir === "rtl" ? "100%" : "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
            >
              <div className="flex justify-end p-3">
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-full p-2 text-muted hover:bg-panel-2"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="px-4 py-6 sm:px-6 lg:ms-64 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
