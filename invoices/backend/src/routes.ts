import { Router, Request, Response } from "express";
import { getInvoice, getInvoiceByOrderId, createInvoice, setInvoicePdfUrl } from "./store";
import { createInvoiceSchema } from "./validation";
import { fetchOrder, enrichOrderItemsWithProductInfo } from "./service";
import { generateInvoicePdfBuffer } from "./pdf";

const router = Router();

router.post("/invoices", async (req: Request, res: Response) => {
  const parsed = createInvoiceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    return;
  }
  const existing = getInvoiceByOrderId(parsed.data.orderId);
  if (existing) {
    res.status(201).json(existing);
    return;
  }
  const order = await fetchOrder(parsed.data.orderId);
  if (!order) {
    res.status(404).json({ message: "Order not found" });
    return;
  }
  const items = await enrichOrderItemsWithProductInfo(order.items);
  const invoice = createInvoice({
    orderId: order.id,
    userId: order.userId,
    amount: order.totalAmount,
    currency: order.currency,
    items,
  });
  const buffer = await generateInvoicePdfBuffer(invoice);
  setInvoicePdfUrl(invoice.id, `/invoices/${invoice.id}/pdf`);
  res.status(201).json({
    id: invoice.id,
    orderId: invoice.orderId,
    amount: invoice.amount,
    currency: invoice.currency,
    createdAt: invoice.createdAt,
  });
});

router.get("/invoices/order/:orderId", (req: Request, res: Response) => {
  const invoice = getInvoiceByOrderId(req.params.orderId);
  if (!invoice) {
    res.status(404).json({ message: "Invoice not found for this order" });
    return;
  }
  res.json(invoice);
});

router.get("/invoices/:invoiceId", (req: Request, res: Response) => {
  const invoice = getInvoice(req.params.invoiceId);
  if (!invoice) {
    res.status(404).json({ message: "Invoice not found" });
    return;
  }
  res.json(invoice);
});

router.get("/invoices/:invoiceId/pdf", async (req: Request, res: Response) => {
  const invoice = getInvoice(req.params.invoiceId);
  if (!invoice) {
    res.status(404).json({ message: "Invoice not found" });
    return;
  }
  const buffer = await generateInvoicePdfBuffer(invoice);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="invoice-${invoice.id}.pdf"`);
  res.send(buffer);
});

export default router;
