import { lazy, Suspense, useEffect, useRef } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { ScrollProgress } from "@/components/effects/ScrollProgress";
import { trackPageView } from "@/lib/pixel";

// Storefront pages are the customer-facing critical path — kept eager for
// Landing (first paint) but code-split per route so /checkout and /product
// don't all land in one bundle.
import Landing from "@/pages/Landing";
const Shop = lazy(() => import("@/pages/Shop"));
const ProductPage = lazy(() => import("@/pages/Product"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const OrderConfirmation = lazy(() => import("@/pages/OrderConfirmation"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Admin dashboard: staff-only, never needed by a storefront customer —
// split into its own chunk entirely.
const AdminLogin = lazy(() => import("@/pages/admin/Login"));
const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"));
const Dashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminProducts = lazy(() => import("@/pages/admin/Products"));
const ProductForm = lazy(() => import("@/pages/admin/ProductForm"));
const AdminCategories = lazy(() => import("@/pages/admin/Categories"));
const AdminOrders = lazy(() => import("@/pages/admin/Orders"));
const AdminOrderDetail = lazy(() => import("@/pages/admin/OrderDetail"));
const AdminDeliveryPrices = lazy(() => import("@/pages/admin/DeliveryPrices"));
const AdminReviews = lazy(() => import("@/pages/admin/Reviews"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PixelPageView() {
  const { pathname } = useLocation();
  const prevPathname = useRef<string | null>(null);

  useEffect(() => {
    if (prevPathname.current === pathname) return; // initial mount AND StrictMode's dev double-invoke
    const isFirstRender = prevPathname.current === null;
    prevPathname.current = pathname;
    if (isFirstRender || pathname.startsWith("/admin")) return;
    trackPageView();
  }, [pathname]);

  return null;
}

function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ScrollProgress />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-muted">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-line border-t-brand" />
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <PixelPageView />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<StorefrontLayout><Landing /></StorefrontLayout>} />
          <Route path="/shop" element={<StorefrontLayout><Shop /></StorefrontLayout>} />
          <Route
            path="/product/:slug"
            element={
              <StorefrontLayout>
                <ProductPage />
              </StorefrontLayout>
            }
          />
          <Route path="/checkout" element={<StorefrontLayout><Checkout /></StorefrontLayout>} />
          <Route
            path="/order-confirmation/:orderNumber"
            element={
              <StorefrontLayout>
                <OrderConfirmation />
              </StorefrontLayout>
            }
          />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id" element={<ProductForm />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetail />} />
            <Route path="delivery-prices" element={<AdminDeliveryPrices />} />
            <Route path="reviews" element={<AdminReviews />} />
          </Route>

          <Route path="*" element={<StorefrontLayout><NotFound /></StorefrontLayout>} />
        </Routes>
      </Suspense>
    </>
  );
}
