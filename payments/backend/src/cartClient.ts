import { get } from "./httpClient";
import { env } from "./env";

export interface CartSummary {
  cartId: string;
  total: number;
  subtotal: number;
  itemCount: number;
}

export async function getCartSummary(cartId: string): Promise<CartSummary | null> {
  try {
    const url = `${env.cartsServiceUrl}/cart/summary/${encodeURIComponent(cartId)}`;
    return await get<CartSummary>(url);
  } catch {
    return null;
  }
}
