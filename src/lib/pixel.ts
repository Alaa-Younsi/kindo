// Superseded by src/lib/tracking.ts (admin-managed, DB-driven Meta + TikTok
// pixels). Kept as a thin re-export so existing call sites don't churn — the
// event helpers now fan out to every matching pixel of both providers, guard a
// missing/NaN/0 `value`, and no-op safely behind an ad blocker.
export {
  trackPageView,
  trackViewContent,
  trackAddToCart,
  trackInitiateCheckout,
  trackPurchase,
} from "@/lib/tracking";
