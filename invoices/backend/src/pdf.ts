import PDFDocument from "pdfkit";
import type { Invoice } from "./types";

export function generateInvoicePdfBuffer(invoice: Invoice): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text("INVOICE", { align: "center" });
    doc.moveDown();
    doc.fontSize(10).text(`Invoice ID: ${invoice.id}`, { align: "left" });
    doc.text(`Order ID: ${invoice.orderId}`);
    doc.text(`Date: ${invoice.createdAt}`);
    doc.moveDown();
    doc.text("Items:", { underline: true });
    doc.moveDown(0.5);
    invoice.items.forEach((item) => {
      const line = item.sku
        ? `[${item.sku}] ${item.name} x ${item.quantity} @ ${invoice.currency} ${item.price.toFixed(2)} = ${invoice.currency} ${(item.quantity * item.price).toFixed(2)}`
        : `${item.name} x ${item.quantity} @ ${invoice.currency} ${item.price.toFixed(2)} = ${invoice.currency} ${(item.quantity * item.price).toFixed(2)}`;
      doc.text(line);
    });
    doc.moveDown();
    doc.text(`Total: ${invoice.currency} ${invoice.amount.toFixed(2)}`, { align: "right" });
    doc.end();
  });
}
