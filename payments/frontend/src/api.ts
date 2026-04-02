import { API_BASE } from "./config";

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  stripePaymentIntentId?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiErrorBody {
  message?: string;
  errors?: { fieldErrors?: Record<string, string[]> };
  cartTotal?: number;
}

function buildErrorMessage(res: Response, err: ApiErrorBody): string {
  const msg = err.message ?? `HTTP ${res.status}`;
  if (err.cartTotal !== undefined) return `${msg} (cart total: ${err.cartTotal})`;
  const fieldErrors = err.errors?.fieldErrors;
  if (fieldErrors && Object.keys(fieldErrors).length) {
    const parts = Object.entries(fieldErrors).map(([k, v]) => `${k}: ${(v ?? []).join(", ")}`);
    return `${msg}: ${parts.join("; ")}`;
  }
  return msg;
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as ApiErrorBody;
    throw new Error(buildErrorMessage(res, err));
  }
  return res.json();
}

// --- Stripe flow ---

export interface StripeConfig {
  publishableKey: string;
}

export async function getStripeConfig(): Promise<StripeConfig> {
  return fetchApi("/payments/config");
}

export interface CreateIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
}

export async function createPaymentIntent(
  orderId: string,
  amount: number,
  currency: string,
  cartId?: string,
  userEmail?: string,
): Promise<CreateIntentResponse> {
  return fetchApi("/payments/create-intent", {
    method: "POST",
    body: JSON.stringify({ orderId, amount, currency, ...(cartId && { cartId }), ...(userEmail && { userEmail }) }),
  });
}

export interface ConfirmStripeResponse {
  success: boolean;
  paymentId: string;
  orderId: string;
  stripeStatus: string;
  orderConfirmed: boolean;
}

export async function confirmStripePayment(
  paymentIntentId: string,
  paymentId: string,
  orderId: string,
  userEmail?: string,
): Promise<ConfirmStripeResponse> {
  return fetchApi("/payments/confirm-stripe", {
    method: "POST",
    body: JSON.stringify({ paymentIntentId, paymentId, orderId, ...(userEmail && { userEmail }) }),
  });
}

// --- Existing endpoints ---

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

// --- List all payments ---

export async function getAllPayments(): Promise<Payment[]> {
  return fetchApi<Payment[]>("/payments");
}
