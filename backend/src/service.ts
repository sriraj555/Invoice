import { get } from "./httpClient";
import { env } from "./env";
import type { Order } from "./types";
import type { InvoiceItem } from "./types";
import { getProduct } from "./productClient";

export async function fetchOrder(orderId: string): Promise<Order | null> {
  try {
    const url = `${env.ordersServiceUrl}/orders/${encodeURIComponent(orderId)}`;
    return await get<Order>(url);
  } catch {
    return null;
  }
}

export async function enrichOrderItemsWithProductInfo(
  items: Array<{ productId: string; name: string; quantity: number; price: number }>
): Promise<InvoiceItem[]> {
  const result: InvoiceItem[] = [];
  for (const item of items) {
    const product = await getProduct(item.productId);
    result.push({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      sku: product?.sku,
    });
  }
  return result;
}
