import { API_BASE } from "./config";

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
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

export async function validatePayment(orderId: string, amount: number, currency: string, cartId?: string): Promise<{ valid: boolean }> {
  return fetchApi("/payments/validate", {
    method: "POST",
    body: JSON.stringify({ orderId, amount, currency, ...(cartId && { cartId }) }),
  });
}

export async function processPayment(
  orderId: string,
  amount: number,
  currency: string,
  cartId?: string
): Promise<Payment & { orderConfirmed?: boolean }> {
  return fetchApi("/payments", {
    method: "POST",
    body: JSON.stringify({ orderId, amount, currency, ...(cartId && { cartId }) }),
  });
}

export async function getPayment(paymentId: string): Promise<Payment> {
  return fetchApi<Payment>(`/payments/${encodeURIComponent(paymentId)}`);
}

export async function getPaymentStatus(paymentId: string): Promise<{ paymentId: string; orderId: string; status: string }> {
  return fetchApi(`/payments/status/${encodeURIComponent(paymentId)}`);
}
