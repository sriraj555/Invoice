import { API_BASE } from "./config";

export interface Invoice {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  items: Array<{ name: string; quantity: number; price: number; sku?: string }>;
  createdAt: string;
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getAllInvoices(): Promise<Invoice[]> {
  return fetchApi<Invoice[]>("/invoices");
}

export async function createInvoice(orderId: string): Promise<{ id: string; orderId: string; amount: number; currency: string; createdAt: string }> {
  return fetchApi("/invoices", { method: "POST", body: JSON.stringify({ orderId }) });
}

export async function getInvoiceByOrderId(orderId: string): Promise<Invoice> {
  return fetchApi<Invoice>(`/invoices/order/${encodeURIComponent(orderId)}`);
}

export async function getInvoice(invoiceId: string): Promise<Invoice> {
  return fetchApi<Invoice>(`/invoices/${encodeURIComponent(invoiceId)}`);
}

export interface QrCodeResult {
  qrCodeUrl: string;
  invoiceId: string;
  data: string;
}

export async function getInvoiceQrCode(invoiceId: string): Promise<QrCodeResult> {
  return fetchApi<QrCodeResult>(`/invoices/${encodeURIComponent(invoiceId)}/qr-code`);
}

// --- Cross-service: Orders ---

export interface Order {
  id: string;
  userId: string;
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export async function getOrders(): Promise<Order[]> {
  return fetchApi<Order[]>("/orders");
}
