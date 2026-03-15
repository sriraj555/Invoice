const PRODUCTS_SERVICE_URL = process.env.PRODUCTS_SERVICE_URL ?? "http://localhost:4001";

export interface ProductResponse {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export async function fetchProduct(productId: string): Promise<ProductResponse | null> {
  try {
    const url = `${PRODUCTS_SERVICE_URL}/products/${encodeURIComponent(productId)}`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as ProductResponse;
  } catch {
    return null;
  }
}
