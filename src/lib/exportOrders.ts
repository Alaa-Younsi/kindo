import * as XLSX from "xlsx";
import { formatDate, formatPrice } from "@/lib/format";
import type { Order } from "@/types/db";

const HEADERS = [
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
];

const STATUS_LABEL_FR: Record<Order["status"], string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

/**
 * Neutralize spreadsheet formula injection: customer_name/city/address/notes
 * are free-text checkout input, not sanitized against leading =/+/-/@ — a
 * customer name like `=cmd|'/c calc'!A1` would execute as a formula for
 * whoever opens the exported file in Excel/Sheets. Prefixing with a single
 * quote forces text interpretation without changing the visible value.
 */
function excelSafe(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export function exportOrdersToExcel(orders: Order[]) {
  const rows = orders.map((order) => [
    order.order_number,
    excelSafe(order.customer_name),
    order.customer_phone,
    excelSafe(order.wilaya),
    excelSafe(order.city),
    excelSafe(order.address ?? ""),
    STATUS_LABEL_FR[order.status],
    order.delivery_type === "home" ? "À domicile" : "Point de retrait",
    formatPrice(order.subtotal),
    formatPrice(order.shipping),
    formatPrice(order.discount ?? 0),
    formatPrice(order.total),
    excelSafe(order.notes ?? ""),
    formatDate(order.created_at, "fr"),
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Commandes");

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `commandes-${today}.xlsx`);
}
