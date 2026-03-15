import { post } from "./httpClient";
import { env } from "./env";

interface InvoiceResult {
  id: string;
  orderId: string;
}

export async function clearCart(cartId: string): Promise<boolean> {
  try {
    const url = `${env.cartsServiceUrl}/cart/${encodeURIComponent(cartId)}/clear`;
    await post(url, {});
    return true;
  } catch {
    return false;
  }
}

export async function decreaseProductStock(productId: string, quantity: number): Promise<boolean> {
  try {
    const url = `${env.productsServiceUrl}/products/${encodeURIComponent(productId)}/decrease-stock`;
    await post(url, { quantity });
    return true;
  } catch {
    return false;
  }
}

interface InventoryCheckResult {
  productId: string;
  quantity: number;
  available: boolean;
}

export async function validateStock(productId: string, quantity: number): Promise<boolean> {
  try {
    const url = `${env.productsServiceUrl}/products/inventory/check`;
    const result = await post<InventoryCheckResult>(url, { productId, quantity });
    return result.available;
  } catch {
    return false;
  }
}

export async function createInvoiceForOrder(orderId: string): Promise<InvoiceResult | null> {
  try {
    const url = `${env.invoicesServiceUrl}/invoices`;
    return await post<InvoiceResult>(url, { orderId });
  } catch {
    return null;
  }
}

export async function sendOrderConfirmationEmail(
  orderId: string,
  userEmail: string,
  totalAmount: number,
  currency: string
): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: userEmail }] }],
          from: { email: process.env.SENDGRID_FROM ?? "noreply@example.com", name: "E-commerce" },
          subject: `Order ${orderId} confirmed`,
          content: [
            {
              type: "text/plain",
              value: `Your order ${orderId} has been confirmed. Total: ${currency} ${totalAmount.toFixed(2)}`,
            },
          ],
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
  const mailgunKey = process.env.MAILGUN_API_KEY;
  const mailgunDomain = process.env.MAILGUN_DOMAIN;
  if (mailgunKey && mailgunDomain) {
    try {
      const auth = Buffer.from(`api:${mailgunKey}`).toString("base64");
      const form = new FormData();
      form.append("from", process.env.MAILGUN_FROM ?? `E-commerce <mailgun@${mailgunDomain}>`);
      form.append("to", userEmail);
      form.append("subject", `Order ${orderId} confirmed`);
      form.append("text", `Your order ${orderId} has been confirmed. Total: ${currency} ${totalAmount.toFixed(2)}`);
      const res = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
        method: "POST",
        headers: { Authorization: `Basic ${auth}` },
        body: form,
      });
      return res.ok;
    } catch {
      return false;
    }
  }
  return true;
}
