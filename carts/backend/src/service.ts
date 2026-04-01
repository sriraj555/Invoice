import { get, post } from "./httpClient";
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

export async function validatePaymentForCheckout(
  orderId: string,
  amount: number,
  currency: string,
  cartId: string
): Promise<boolean> {
  try {
    const url = `${env.paymentsServiceUrl}/payments/validate`;
    const result = await post<{ valid: boolean }>(url, { orderId, amount, currency, cartId });
    return result.valid;
  } catch {
    return false;
  }
}

export async function submitOrderFromCart(payload: {
  userId: string;
  cartId: string;
  items: Array<{ productId: string; quantity: number; price: number; name: string }>;
  totalAmount: number;
  currency: string;
}): Promise<{ id: string; status: string }> {
  const url = `${env.ordersServiceUrl}/orders`;
  return await post<{ id: string; status: string }>(url, payload);
}
