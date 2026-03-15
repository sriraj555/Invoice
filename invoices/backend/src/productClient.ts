import { get } from "./httpClient";
import { env } from "./env";

export interface ProductInfo {
  id: string;
  name: string;
  sku?: string;
  price: number;
}

export async function getProduct(productId: string): Promise<ProductInfo | null> {
  try {
    const url = `${env.productsServiceUrl}/products/${encodeURIComponent(productId)}`;
    const p = await get<ProductInfo>(url);
    return p;
  } catch {
    return null;
  }
}
