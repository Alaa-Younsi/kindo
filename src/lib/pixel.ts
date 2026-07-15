declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

type PixelParams = Record<string, unknown> & { value?: unknown };

function hasValidValue(params?: PixelParams): boolean {
  if (!params || !("value" in params)) return true;
  const value = params.value;
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function track(event: string, params?: PixelParams) {
  if (!hasValidValue(params)) {
    if (import.meta.env.DEV) {
      console.warn(`[pixel] skipped "${event}" — invalid/missing value`, params);
    }
    return;
  }
  window.fbq?.("track", event, params);
}

export function trackPageView() {
  window.fbq?.("track", "PageView");
}

export function trackViewContent(params: {
  content_ids: string[];
  content_name: string;
  value: number;
  currency: "DZD";
}) {
  track("ViewContent", params);
}

export function trackAddToCart(params: {
  content_ids: string[];
  content_name: string;
  value: number;
  currency: "DZD";
}) {
  track("AddToCart", params);
}

export function trackInitiateCheckout(params: {
  content_ids: string[];
  value: number;
  currency: "DZD";
  num_items: number;
}) {
  track("InitiateCheckout", params);
}

export function trackPurchase(params: {
  content_ids: string[];
  value: number;
  currency: "DZD";
  order_id: string;
}) {
  track("Purchase", params);
}
