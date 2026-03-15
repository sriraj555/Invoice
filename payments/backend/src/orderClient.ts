const ORDERS_SERVICE_URL = process.env.ORDERS_SERVICE_URL ?? "http://localhost:4003";

export async function confirmPayment(orderId: string, paymentId: string): Promise<boolean> {
  try {
    const url = `${ORDERS_SERVICE_URL}/orders/${encodeURIComponent(orderId)}/confirm-payment`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
