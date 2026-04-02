import { Router, Request, Response } from "express";
<<<<<<< HEAD
import { getInvoice, getInvoiceByOrderId, getAllInvoices, createInvoice, setInvoicePdfUrl } from "./store";
import { createInvoiceSchema } from "./validation";
import { fetchOrder, enrichOrderItemsWithProductInfo, generateInvoiceQrCode } from "./service";
=======
import { getInvoice, getInvoiceByOrderId, createInvoice, setInvoicePdfUrl } from "./store";
import { createInvoiceSchema } from "./validation";
import { fetchOrder, enrichOrderItemsWithProductInfo } from "./service";
>>>>>>> 939fbba14dc2753b1eaa48d3ee547d81e638fe50
import { generateInvoicePdfBuffer } from "./pdf";

const router = Router();

<<<<<<< HEAD
// List all invoices
router.get("/invoices", (_req: Request, res: Response) => {
  const invoices = getAllInvoices();
  res.json(invoices);
});

=======
>>>>>>> 939fbba14dc2753b1eaa48d3ee547d81e638fe50
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

<<<<<<< HEAD
// QR Code generation via public API (api.qrserver.com)
router.get("/invoices/:invoiceId/qr-code", async (req: Request, res: Response) => {
  const invoice = getInvoice(req.params.invoiceId);
  if (!invoice) {
    res.status(404).json({ message: "Invoice not found" });
    return;
  }
  try {
    const qr = await generateInvoiceQrCode(
      invoice.id,
      invoice.orderId,
      invoice.amount,
      invoice.currency
    );
    res.json(qr);
  } catch (error) {
    res.status(500).json({ message: "QR code generation failed", error: String(error) });
  }
});

=======
>>>>>>> 939fbba14dc2753b1eaa48d3ee547d81e638fe50
router.get("/test-pdf", async (req: Request, res: Response) => {
  try {
    const testInvoice = {
      id: "test-123",
      orderId: "order-456",
      userId: "user-789",
      amount: 99.99,
      currency: "USD",
      items: [
        { name: "Test Product 1", quantity: 2, price: 25.00, sku: "TEST1" },
        { name: "Test Product 2", quantity: 1, price: 49.99, sku: "TEST2" }
      ],
      createdAt: new Date().toISOString()
    };
    
    console.log('Generating test PDF');
    const buffer = await generateInvoicePdfBuffer(testInvoice);
    console.log('Test PDF buffer generated, size:', buffer.length);
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="test-invoice.pdf"`);
    res.setHeader("Content-Length", String(buffer.length));
    res.send(buffer);
  } catch (error) {
    console.error('Test PDF error:', error);
    res.status(500).json({ message: "Test PDF generation failed", error: String(error) });
  }
});

router.get("/invoices/:invoiceId/pdf", async (req: Request, res: Response) => {
  try {
    const invoice = getInvoice(req.params.invoiceId);
    if (!invoice) {
      res.status(404).json({ message: "Invoice not found" });
      return;
    }
    
    console.log('Generating PDF for invoice:', invoice.id);
    const buffer = await generateInvoicePdfBuffer(invoice);
    console.log('PDF buffer generated, size:', buffer.length);
    
    if (buffer.length === 0) {
      res.status(500).json({ message: "PDF generation failed - empty buffer" });
      return;
    }
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="invoice-${invoice.id}.pdf"`);
    res.setHeader("Content-Length", String(buffer.length));
    res.setHeader("Cache-Control", "no-cache");
    
    // Send the buffer directly without specifying encoding
    res.send(buffer);
  } catch (error) {
    console.error('PDF route error:', error);
    res.status(500).json({ message: "PDF generation failed", error: String(error) });
  }
});

export default router;
