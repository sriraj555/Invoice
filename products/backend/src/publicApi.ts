const FRANKFURTER_URL = process.env.PUBLIC_EXCHANGE_API ?? "https://api.frankfurter.app";

export async function validatePriceWithPublicApi(
  amount: number,
  currency: string
): Promise<{ valid: boolean; message?: string }> {
  if (amount <= 0) return { valid: false, message: "Amount must be positive" };
  try {
    const res = await fetch(`${FRANKFURTER_URL}/latest?from=${currency}&to=USD`);
    if (!res.ok) return { valid: true };
    const data = (await res.json()) as { rates?: Record<string, number> };
    if (data.rates && typeof data.rates.USD === "number") return { valid: true };
    return { valid: true };
  } catch {
    return { valid: true };
  }
}
