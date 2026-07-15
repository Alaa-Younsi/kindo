import type { Lang } from "@/types/db";

export function formatPrice(value: number): string {
  const rounded = Math.round(value);
  const withSpaces = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${withSpaces} DA`;
}

export function formatDate(iso: string, lang: Lang = "fr"): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-DZ" : "fr-DZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function localize<T extends Record<string, unknown>>(
  obj: T,
  field: string,
  lang: Lang,
): string {
  const key = `${field}_${lang}` as keyof T;
  const fallbackKey = `${field}_fr` as keyof T;
  return (obj[key] as string) ?? (obj[fallbackKey] as string) ?? "";
}
