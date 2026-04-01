import { post, get } from "./httpClient";
import { env } from "./env";

export async function notifyCartsProductUpdated(
  productId: string,
  price: number,
  name: string
): Promise<boolean> {
  try {
    const url = `${env.cartsServiceUrl}/cart/product-update`;
    await post(url, { productId, price, name });
    return true;
  } catch {
    return false;
  }
}

interface PendingOrdersResult {
  productId: string;
  pendingOrders: Array<{ orderId: string; quantity: number }>;
  count: number;
}

export async function getPendingOrdersForProduct(
  productId: string
): Promise<PendingOrdersResult | null> {
  try {
    const url = `${env.ordersServiceUrl}/orders/by-product/${encodeURIComponent(productId)}`;
    return await get<PendingOrdersResult>(url);
  } catch {
    return null;
  }
}
