import { API_BASE } from "./config";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
  sku?: string;
}

export async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/products`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export interface Cart {
  id: string;
  userId: string;
  items: Array<{ productId: string; quantity: number; price?: number; name?: string }>;
  subtotal?: number;
  total?: number;
  discountCode?: string;
  discountPercent?: number;
}

export interface CartSummary {
  cartId: string;
  itemCount: number;
  subtotal: number;
  total: number;
  discountAmount?: number;
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

export async function createCart(userId: string): Promise<Cart> {
  return fetchApi<Cart>("/cart", { method: "POST", body: JSON.stringify({ userId }) });
}

export async function getCart(cartId: string): Promise<Cart & { subtotal: number; total: number }> {
  return fetchApi<Cart & { subtotal: number; total: number }>(`/cart/${encodeURIComponent(cartId)}`);
}

export async function getCartSummary(cartId: string): Promise<CartSummary> {
  return fetchApi<CartSummary>(`/cart/summary/${encodeURIComponent(cartId)}`);
}

export async function addToCart(cartId: string, productId: string, quantity: number): Promise<Cart> {
  return fetchApi<Cart>(`/cart/${encodeURIComponent(cartId)}/items`, {
    method: "POST",
    body: JSON.stringify({ productId, quantity }),
  });
}

export async function updateCartItem(cartId: string, productId: string, quantity: number): Promise<Cart> {
  return fetchApi<Cart>(`/cart/${encodeURIComponent(cartId)}/items/${encodeURIComponent(productId)}`, {
    method: "PUT",
    body: JSON.stringify({ quantity }),
  });
}

export async function removeFromCart(cartId: string, productId: string): Promise<Cart> {
  return fetchApi<Cart>(`/cart/${encodeURIComponent(cartId)}/items/${encodeURIComponent(productId)}`, {
    method: "DELETE",
  });
}

export async function applyDiscount(cartId: string, code: string): Promise<Cart & { subtotal: number; total: number }> {
  return fetchApi(`/cart/${encodeURIComponent(cartId)}/discount`, {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export async function clearCart(cartId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/cart/${encodeURIComponent(cartId)}/clear`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`);
  }
}

// --- Currency Conversion (Frankfurter Public API) ---
export interface ConvertResult {
  cartId: string;
  total: number;
  currency: string;
  converted: Record<string, number>;
}

export async function convertCartCurrency(cartId: string, to: string): Promise<ConvertResult> {
  return fetchApi<ConvertResult>(`/cart/${encodeURIComponent(cartId)}/convert?to=${encodeURIComponent(to)}`);
}

export interface CreateOrderPayload {
  userId: string;
  cartId: string;
  items: Array<{ productId: string; quantity: number; price: number; name: string }>;
  totalAmount: number;
  currency: string;
}

export interface Order {
  id: string;
  status: string;
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  return fetchApi<Order>("/orders", { method: "POST", body: JSON.stringify(payload) });
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
): Promise<{ id: string; status: string; orderConfirmed?: boolean }> {
  return fetchApi("/payments", {
    method: "POST",
    body: JSON.stringify({ orderId, amount, currency, ...(cartId && { cartId }) }),
  });
}
