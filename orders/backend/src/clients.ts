const CARTS_SERVICE_URL = process.env.CARTS_SERVICE_URL ?? "http://localhost:4002";
const INVOICES_SERVICE_URL = process.env.INVOICES_SERVICE_URL ?? "http://localhost:4005";

export async function clearCart(cartId: string): Promise<boolean> {
  try {
    const url = `${CARTS_SERVICE_URL}/cart/${encodeURIComponent(cartId)}/clear`;
    const res = await fetch(url, { method: "POST" });
    return res.ok;
  } catch {
    return false;
  }
}

export interface InvoiceResponse {
  id: string;
  orderId: string;
  amount?: number;
}

export async function createInvoice(orderId: string): Promise<InvoiceResponse | null> {
  try {
    const url = `${INVOICES_SERVICE_URL}/invoices`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    if (!res.ok) return null;
    return (await res.json()) as InvoiceResponse;
  } catch {
    return null;
  }
}
