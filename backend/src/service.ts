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
<<<<<<< HEAD

// --- Public API: QR Code Generation (api.qrserver.com) ---
export interface QrCodeResult {
  qrCodeUrl: string;
  invoiceId: string;
  data: string;
}

export async function generateInvoiceQrCode(
  invoiceId: string,
  orderId: string,
  amount: number,
  currency: string
): Promise<QrCodeResult> {
  const data = JSON.stringify({
    type: "INVOICE",
    invoiceId,
    orderId,
    amount,
    currency,
    generatedAt: new Date().toISOString(),
  });
  const encoded = encodeURIComponent(data);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encoded}`;

  // Verify the API is reachable by making a HEAD request
  try {
    const res = await fetch(qrCodeUrl, { method: "HEAD" });
    if (!res.ok) throw new Error(`QR API returned ${res.status}`);
  } catch {
    // API unreachable, still return URL (browser can try directly)
  }

  return { qrCodeUrl, invoiceId, data };
}
=======
>>>>>>> 939fbba14dc2753b1eaa48d3ee547d81e638fe50
