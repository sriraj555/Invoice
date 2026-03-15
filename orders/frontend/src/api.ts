import { API_BASE } from "./config";

export interface Order {
  id: string;
  userId: string;
  cartId: string;
  items: Array<{ productId: string; quantity: number; price: number; name: string }>;
  totalAmount: number;
  currency: string;
  status: string;
  paymentId?: string;
  invoiceId?: string;
  shippingAddress?: string;
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

export async function createOrder(payload: {
  userId: string;
  cartId: string;
  items: Array<{ productId: string; quantity: number; price: number; name: string }>;
  totalAmount: number;
  currency: string;
  shippingAddress?: string;
}): Promise<Order> {
  return fetchApi<Order>("/orders", { method: "POST", body: JSON.stringify(payload) });
}

export async function getOrder(orderId: string): Promise<Order> {
  return fetchApi<Order>(`/orders/${encodeURIComponent(orderId)}`);
}

export async function getOrders(userId?: string): Promise<Order[]> {
  const path = userId ? `/orders?userId=${encodeURIComponent(userId)}` : "/orders";
  return fetchApi<Order[]>(path);
}

export async function updateOrderStatus(orderId: string, status: Order["status"]): Promise<Order> {
  return fetchApi<Order>(`/orders/${encodeURIComponent(orderId)}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}
