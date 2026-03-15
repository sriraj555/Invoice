import type { Invoice } from "./types";
import { v4 as uuidv4 } from "uuid";

const invoices = new Map<string, Invoice>();

export function getInvoice(invoiceId: string): Invoice | undefined {
  return invoices.get(invoiceId);
}

export function getInvoiceByOrderId(orderId: string): Invoice | undefined {
  return Array.from(invoices.values()).find((i) => i.orderId === orderId);
}

export function createInvoice(input: Omit<Invoice, "id" | "createdAt">): Invoice {
  const id = uuidv4();
  const now = new Date().toISOString();
  const invoice: Invoice = {
    ...input,
    id,
    createdAt: now,
  };
  invoices.set(id, invoice);
  return invoice;
}

export function setInvoicePdfUrl(invoiceId: string, pdfUrl: string): Invoice | undefined {
  const inv = invoices.get(invoiceId);
  if (!inv) return undefined;
  inv.pdfUrl = pdfUrl;
  return inv;
}
