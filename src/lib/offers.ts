export function isOnSale(price: number, compareAtPrice: number | null): boolean {
  return typeof compareAtPrice === "number" && compareAtPrice > price;
}

export function discountPercent(price: number, compareAtPrice: number | null): number | null {
  if (!isOnSale(price, compareAtPrice) || !compareAtPrice) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}
