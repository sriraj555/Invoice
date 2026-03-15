import { post } from "./httpClient";
import { env } from "./env";

export async function confirmPaymentWithOrderApi(
  orderId: string,
  paymentId: string,
  userEmail?: string
): Promise<boolean> {
  try {
    const url = `${env.ordersServiceUrl}/orders/${encodeURIComponent(orderId)}/confirm-payment`;
    await post(url, { paymentId, ...(userEmail && { userEmail }) });
    return true;
  } catch {
    return false;
  }
}

export function validateStripePrice(amount: number, currency: string): boolean {
  if (amount <= 0) return false;
  const minAmount: Record<string, number> = { USD: 0.5, EUR: 0.5, GBP: 0.3 };
  return amount >= (minAmount[currency] ?? 0);
}
