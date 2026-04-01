export const API_BASE = import.meta.env.VITE_API_URL ?? "/api-backend";

export function getInvoicePdfUrl(invoiceId: string): string {
  const base = API_BASE.startsWith("http") ? API_BASE : `${window.location.origin}${API_BASE}`;
  return `${base}/invoices/${encodeURIComponent(invoiceId)}/pdf`;
}
