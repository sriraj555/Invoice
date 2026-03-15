import { API_BASE } from "./config";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
  sku?: string;
  createdAt?: string;
  updatedAt?: string;
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

export async function getProducts(): Promise<Product[]> {
  return fetchApi<Product[]>("/products");
}

export async function getProduct(id: string): Promise<Product> {
  return fetchApi<Product>(`/products/${encodeURIComponent(id)}`);
}

export async function createProduct(data: {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  stock: number;
  sku?: string;
}): Promise<Product> {
  return fetchApi<Product>("/products", {
    method: "POST",
    body: JSON.stringify({ ...data, currency: data.currency ?? "USD", description: data.description ?? "" }),
  });
}

export async function updateProduct(
  id: string,
  data: Partial<{ name: string; description: string; price: number; currency: string; stock: number; sku: string }>
): Promise<Product> {
  return fetchApi<Product>(`/products/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/products/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (res.status !== 204 && res.status !== 404) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`);
  }
}

export async function checkInventory(productId: string, quantity: number): Promise<{ available: boolean }> {
  return fetchApi("/products/inventory/check", {
    method: "POST",
    body: JSON.stringify({ productId, quantity }),
  });
}

export async function getRecommendations(): Promise<Array<{ productId: string; score: number; comment: string }>> {
  return fetchApi("/recommendations");
}

export async function validatePrice(amount: number, currency: string): Promise<{ valid: boolean }> {
  return fetchApi("/products/validate-price", { method: "POST", body: JSON.stringify({ amount, currency }) });
}
