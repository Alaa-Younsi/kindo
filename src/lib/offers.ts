import type { QuantityOffer } from "@/types/db";

export function isOnSale(price: number, compareAtPrice: number | null): boolean {
  return typeof compareAtPrice === "number" && compareAtPrice > price;
}

export function discountPercent(price: number, compareAtPrice: number | null): number | null {
  if (!isOnSale(price, compareAtPrice) || !compareAtPrice) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

/**
 * Client-side mirror of place_order's per-line offer pricing — for
 * optimistic cart/checkout totals only. The RPC is the source of truth;
 * if this math changes, change both.
 */
export function lineTotal(price: number, qty: number, offers: QuantityOffer[]): number {
  const base = price * qty;
  let best = base;

  for (const offer of offers) {
    if (offer.type === "free" && offer.buy > 0 && offer.get > 0) {
      const group = offer.buy + offer.get;
      const freeUnits = Math.floor(qty / group) * offer.get;
      const candidate = base - price * freeUnits;
      if (candidate < best) best = candidate;
    } else if (offer.type === "price" && offer.qty > 0 && offer.price >= 0) {
      const candidate = Math.floor(qty / offer.qty) * offer.price + (qty % offer.qty) * price;
      if (candidate < best) best = candidate;
    }
  }

  return Math.max(best, 0);
}

export function lineDiscount(price: number, qty: number, offers: QuantityOffer[]): number {
  return price * qty - lineTotal(price, qty, offers);
}

/** Drop malformed offer rows (zero/negative fields) so they never round-trip. */
export function sanitizeOffers(offers: QuantityOffer[]): QuantityOffer[] {
  return offers.filter((offer) => {
    if (offer.type === "free") return offer.buy > 0 && offer.get > 0;
    if (offer.type === "price") return offer.qty > 0 && offer.price >= 0;
    return false;
  });
}
