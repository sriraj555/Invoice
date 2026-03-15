import { get } from "./httpClient";
import { env } from "./env";
import type { Product } from "./types";

export async function fetchProduct(productId: string): Promise<Product | null> {
  try {
    const url = `${env.productsServiceUrl}/products/${encodeURIComponent(productId)}`;
    return await get<Product>(url);
  } catch {
    return null;
  }
}
