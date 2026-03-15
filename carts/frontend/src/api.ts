import { API_BASE } from "./config";

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
