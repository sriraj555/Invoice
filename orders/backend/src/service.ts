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

export async function validatePaymentAmount(
  orderId: string,
  amount: number,
  currency: string
): Promise<{ valid: boolean; message?: string } | null> {
  try {
    const url = `${env.paymentsServiceUrl}/payments/validate`;
    return await post<{ valid: boolean; message?: string }>(url, {
      orderId,
      amount,
      currency,
    });
  } catch {
    return null;
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

// --- Public API: REST Countries ---
export interface CountryInfo {
  name: string;
  officialName: string;
  capital: string[];
  region: string;
  subregion: string;
  currencies: Record<string, { name: string; symbol: string }>;
  languages: Record<string, string>;
  population: number;
  flag: string;
  timezones: string[];
}

export async function lookupCountry(code: string): Promise<CountryInfo | null> {
  try {
    const url = `https://restcountries.com/v3.1/alpha/${encodeURIComponent(code.toUpperCase())}?fields=name,capital,region,subregion,currencies,languages,population,flag,timezones`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      name: { common: string; official: string };
      capital?: string[];
      region: string;
      subregion: string;
      currencies?: Record<string, { name: string; symbol: string }>;
      languages?: Record<string, string>;
      population: number;
      flag: string;
      timezones: string[];
    };
    return {
      name: data.name.common,
      officialName: data.name.official,
      capital: data.capital ?? [],
      region: data.region,
      subregion: data.subregion,
      currencies: data.currencies ?? {},
      languages: data.languages ?? {},
      population: data.population,
      flag: data.flag,
      timezones: data.timezones,
    };
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
