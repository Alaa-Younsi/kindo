import type { TranslationKey } from "@/i18n/translations";

const ERROR_CODES = [
  "ERR_CART_EMPTY",
  "ERR_PRODUCT_UNAVAILABLE",
  "ERR_STOCK",
  "ERR_WILAYA_DISABLED",
  "ERR_INVALID_INPUT",
  "ERR_MISSING_SELECTION",
  "ERR_RATE_LIMIT",
] as const;

/** Maps a raised `ERR_*` Postgres exception message to a translation key. */
export function orderErrorKey(error: unknown): TranslationKey {
  const message = error instanceof Error ? error.message : String(error);
  for (const code of ERROR_CODES) {
    if (message.includes(code)) {
      return `error.${code}` as TranslationKey;
    }
  }
  return "error.generic";
}
