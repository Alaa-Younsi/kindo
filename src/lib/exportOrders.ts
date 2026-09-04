import { formatDate, formatPrice } from "@/lib/format";
import type { Order } from "@/types/db";

const STATUS_LABEL_FR: Record<Order["status"], string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

/**
 * Neutralise spreadsheet formula injection: customer_name/city/address/notes
 * are free-text checkout input, not restricted to a safe character set — a
 * customer named `=cmd|'/c calc'!A1` would execute as a formula for whoever
 * opens the export in Excel/Sheets. Prefixing with a single quote forces text
 * interpretation without changing the visible value. React's DOM escaping does
 * NOT cover this sink — a spreadsheet app is a different renderer entirely.
 */
function excelSafe(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

/**
 * Dispatch-list export. Uses `write-excel-file/browser` (~70 KB, code-split on
 * first call) instead of `xlsx` (425 KB / 141 KB gzip for one button).
 */
export async function exportOrdersToExcel(orders: Order[]) {
  // The `/browser` subpath — the bare package has no "." export for the
  // browser condition and the build fails on it.
  const { default: writeXlsxFile } = await import("write-excel-file/browser");

  const HEADER_ROW = [
    "N° commande",
    "Client",
    "Téléphone",
    "Wilaya",
    "Commune",
    "Adresse",
    "Statut",
    "Type de livraison",
    "Sous-total",
    "Livraison",
    "Remise",
    "Total",
    "Notes",
    "Date",
  ].map((value) => ({ value, fontWeight: "bold" as const }));

  const dataRows = orders.map((order) => [
    { value: order.order_number },
    { value: excelSafe(order.customer_name) },
    { value: order.customer_phone },
    { value: excelSafe(order.wilaya) },
    { value: excelSafe(order.city) },
    { value: excelSafe(order.address ?? "") },
    { value: STATUS_LABEL_FR[order.status] },
    { value: order.delivery_type === "home" ? "À domicile" : "Point de retrait" },
    { value: formatPrice(order.subtotal) },
    { value: formatPrice(order.shipping) },
    { value: formatPrice(order.discount ?? 0) },
    { value: formatPrice(order.total) },
    { value: excelSafe(order.notes ?? "") },
    { value: formatDate(order.created_at, "fr") },
  ]);

  const today = new Date().toISOString().slice(0, 10);
  await writeXlsxFile([HEADER_ROW, ...dataRows], {
    fileName: `commandes-${today}.xlsx`,
    sheet: "Commandes",
  });
}
