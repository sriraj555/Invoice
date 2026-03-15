const ORDERS_SERVICE_URL = process.env.ORDERS_SERVICE_URL ?? "http://localhost:4003";

export interface OrderResponse {
  id: string;
  orderId?: string;
  userId: string;
  cartId: string;
  amount?: number;
  totalAmount?: number;
}

export async function fetchOrder(orderId: string): Promise<OrderResponse | null> {
  try {
    const url = `${ORDERS_SERVICE_URL}/orders/${encodeURIComponent(orderId)}`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as OrderResponse;
  } catch {
    return null;
  }
}
