// Runtime for admin-managed, DB-driven tracking pixels — Meta (fbq) and
// TikTok (ttq) side by side. Nothing here is hardcoded: which pixels are live
// on a given page is decided from the `tracking_pixels` table by scope.
//
// Rules that shape everything:
//  1. Meta events go through `trackSingle`, never plain `track` — plain `track`
//     broadcasts to every initialised pixel and cross-contaminates campaigns.
//     TikTok gets the same isolation via `ttq.instance(id)`.
//  2. Every entry point is a safe no-op when window/fbq/ttq is absent — an ad
//     blocker is the common case for many Algerian visitors and MUST NEVER
//     break checkout. Nothing in this module throws.

export type PixelProvider = "meta" | "tiktok";
export type PixelEventKey =
  | "page_view"
  | "view_content"
  | "add_to_cart"
  | "initiate_checkout"
  | "purchase";

export interface TrackingPixel {
  id: string;
  provider: PixelProvider;
  label: string;
  pixel_id: string;
  active: boolean;
  scope: "all" | "paths";
  match_values: string[];
  events: Record<PixelEventKey, boolean>;
  currency: string;
  sort_order: number;
  notes: string | null;
}

export interface EventPayload {
  value?: number;
  contentIds?: string[];
  contentName?: string;
  numItems?: number;
  orderId?: string;
}

type Fbq = (...args: unknown[]) => void;
type TtqInstance = { track: (event: string, params?: unknown) => void; page: () => void };
type Ttq = {
  load?: (id: string) => void;
  page?: () => void;
  track?: (event: string, params?: unknown) => void;
  instance?: (id: string) => TtqInstance;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: unknown;
    ttq?: Ttq;
  }
}

let activePixels: TrackingPixel[] = [];
let currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
const initedMeta = new Set<string>();
const initedTikTok = new Set<string>();

const META_EVENT: Record<Exclude<PixelEventKey, "page_view">, string> = {
  view_content: "ViewContent",
  add_to_cart: "AddToCart",
  initiate_checkout: "InitiateCheckout",
  purchase: "Purchase",
};
const TIKTOK_EVENT: Record<Exclude<PixelEventKey, "page_view">, string> = {
  view_content: "ViewContent",
  add_to_cart: "AddToCart",
  initiate_checkout: "InitiateCheckout",
  purchase: "CompletePayment",
};

// Vendor base snippets injected verbatim as text — the canonical form, and it
// keeps their deep internal shapes out of our type surface. Each runs once.
const META_BASE = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('set','autoConfig',false,'all');`;
const TIKTOK_BASE = `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript";o.async=!0;o.src=r+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)}}(window,document,'ttq');`;

let metaBaseInstalled = false;
let tiktokBaseInstalled = false;

function runInlineScript(code: string) {
  const s = document.createElement("script");
  s.textContent = code;
  document.head.appendChild(s);
}

function ensureFbq() {
  if (typeof window === "undefined" || metaBaseInstalled) return;
  metaBaseInstalled = true;
  try {
    if (!window.fbq) runInlineScript(META_BASE);
  } catch {
    /* CSP / blocker */
  }
}

function ensureTtq() {
  if (typeof window === "undefined" || tiktokBaseInstalled) return;
  tiktokBaseInstalled = true;
  try {
    if (!window.ttq) runInlineScript(TIKTOK_BASE);
  } catch {
    /* CSP / blocker */
  }
}

function normalizeEvents(raw: unknown): Record<PixelEventKey, boolean> {
  const keys: PixelEventKey[] = ["page_view", "view_content", "add_to_cart", "initiate_checkout", "purchase"];
  const src = (raw ?? {}) as Record<string, unknown>;
  const out = {} as Record<PixelEventKey, boolean>;
  for (const k of keys) out[k] = src[k] !== false;
  return out;
}

/** Feed the current active-pixel set from the DB. Idempotent per pixel id. */
export function configurePixels(rows: TrackingPixel[]) {
  activePixels = rows
    .filter((p) => p.active && /^[\w.-]{6,40}$/.test(p.pixel_id))
    .map((p) => ({ ...p, events: normalizeEvents(p.events) }));

  const hasMeta = activePixels.some((p) => p.provider === "meta");
  const hasTikTok = activePixels.some((p) => p.provider === "tiktok");
  if (hasMeta) ensureFbq();
  if (hasTikTok) ensureTtq();

  for (const p of activePixels) {
    if (p.provider === "meta" && !initedMeta.has(p.pixel_id)) {
      try {
        window.fbq?.("init", p.pixel_id);
      } catch {
        /* blocked */
      }
      initedMeta.add(p.pixel_id);
    }
    if (p.provider === "tiktok" && !initedTikTok.has(p.pixel_id)) {
      try {
        window.ttq?.load?.(p.pixel_id);
      } catch {
        /* blocked */
      }
      initedTikTok.add(p.pixel_id);
    }
  }
}

export function setTrackingPath(pathname: string) {
  currentPath = pathname;
}

/** Pixels whose scope matches the current path. Empty `match_values` on a
 *  `paths` pixel means "every page" (the useful default), not "no pages". */
export function matchedPixels(): TrackingPixel[] {
  return activePixels.filter((p) => {
    if (p.scope === "all") return true;
    if (p.match_values.length === 0) return true;
    return p.match_values.some((v) => currentPath === v || currentPath.startsWith(v));
  });
}

function validValue(v: number | undefined): boolean {
  return v === undefined || (Number.isFinite(v) && v > 0);
}

function dispatch(key: PixelEventKey, payload: EventPayload = {}, eventId?: string, onlyIds?: Set<string>) {
  if (typeof window === "undefined") return;
  if (!validValue(payload.value)) {
    if (import.meta.env.DEV) console.warn(`[tracking] skipped "${key}" — invalid value`, payload);
    return;
  }

  for (const p of matchedPixels()) {
    if (p.events[key] === false) continue;
    if (onlyIds && !onlyIds.has(p.pixel_id)) continue;
    const currency = p.currency || "DZD";

    if (p.provider === "meta") {
      if (!window.fbq) continue;
      const params: Record<string, unknown> = {};
      if (payload.value !== undefined) {
        params.value = payload.value;
        params.currency = currency;
      }
      if (payload.contentIds) params.content_ids = payload.contentIds;
      if (payload.contentName) params.content_name = payload.contentName;
      if (payload.numItems !== undefined) params.num_items = payload.numItems;
      if (payload.orderId) params.order_id = payload.orderId;
      try {
        if (key === "page_view") window.fbq("trackSingle", p.pixel_id, "PageView");
        else if (eventId)
          window.fbq("trackSingle", p.pixel_id, META_EVENT[key], params, { eventID: eventId });
        else window.fbq("trackSingle", p.pixel_id, META_EVENT[key], params);
      } catch {
        /* blocked */
      }
    } else {
      const inst = window.ttq?.instance?.(p.pixel_id);
      if (!inst) continue;
      const params: Record<string, unknown> = {};
      if (payload.value !== undefined) {
        params.value = payload.value;
        params.currency = currency;
      }
      if (payload.contentIds?.length) {
        params.content_id = payload.contentIds[0];
        params.content_type = "product";
      }
      if (payload.contentName) params.content_name = payload.contentName;
      try {
        if (key === "page_view") inst.page();
        else inst.track(TIKTOK_EVENT[key], params);
      } catch {
        /* blocked */
      }
    }
  }
}

// --- public API (call sites unchanged from the old pixel.ts) ------------

export function trackPageView() {
  dispatch("page_view");
}
/** PageView to a specific subset of pixel ids — used by TrackingBridge to send
 *  only to pixels that newly matched a route, never re-firing on the rest. */
export function sendPageViewTo(ids: string[]) {
  dispatch("page_view", {}, undefined, new Set(ids));
}
export function trackViewContent(p: { content_ids: string[]; content_name: string; value: number }) {
  dispatch("view_content", { value: p.value, contentIds: p.content_ids, contentName: p.content_name });
}
export function trackAddToCart(p: { content_ids: string[]; content_name: string; value: number }) {
  dispatch("add_to_cart", { value: p.value, contentIds: p.content_ids, contentName: p.content_name });
}
export function trackInitiateCheckout(p: { content_ids: string[]; value: number; num_items: number }) {
  dispatch("initiate_checkout", { value: p.value, contentIds: p.content_ids, numItems: p.num_items });
}
export function trackPurchase(p: { content_ids: string[]; value: number; order_id: string }) {
  dispatch("purchase", { value: p.value, contentIds: p.content_ids, orderId: p.order_id }, p.order_id);
}
