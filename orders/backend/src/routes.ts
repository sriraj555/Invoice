import { Router, Request, Response } from "express";
import {
  getOrder,
  getOrdersByUserId,
  getAllOrders,
  createOrder,
  updateOrderStatus,
  setOrderPayment,
  setOrderInvoice,
} from "./store";
import { createOrderSchema, updateOrderStatusSchema } from "./validation";
import {
  createInvoiceForOrder,
  clearCart,
  decreaseProductStock,
  validateStock,
  sendOrderConfirmationEmail,
  validatePaymentAmount,
  lookupCountry,
} from "./service";
import { sendOrderEvent } from "./sqsClient";

const router = Router();

router.post("/orders", async (req: Request, res: Response) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    return;
  }
  for (const item of parsed.data.items) {
    const available = await validateStock(item.productId, item.quantity);
    if (!available) {
      res.status(400).json({
        message: "Insufficient stock",
        productId: item.productId,
        quantity: item.quantity,
      });
      return;
    }
  }
  const order = createOrder(parsed.data);

  // Validate payment amount via Payments service (Orders → Payments)
  const paymentValidation = await validatePaymentAmount(
    order.id,
    order.totalAmount,
    order.currency
  );

  // Publish order event to SQS for async payment processing
  await sendOrderEvent({
    type: "ORDER_CREATED",
    orderId: order.id,
    userId: order.userId,
    cartId: order.cartId,
    totalAmount: order.totalAmount,
    currency: order.currency,
    items: order.items,
  });

  res.status(201).json({
    ...order,
    paymentValidation: paymentValidation
      ? { valid: paymentValidation.valid }
      : { valid: false, message: "Payment service unavailable" },
  });
});

router.get("/orders", (req: Request, res: Response) => {
  const userId = (req.query.userId as string)?.trim();
  const orders = userId ? getOrdersByUserId(userId) : getAllOrders();
  res.json(orders);
});

router.get("/orders/:orderId", (req: Request, res: Response) => {
  const order = getOrder(req.params.orderId);
  if (!order) {
    res.status(404).json({ message: "Order not found" });
    return;
  }
  res.json(order);
});

router.put("/orders/:orderId", async (req: Request, res: Response) => {
  const order = getOrder(req.params.orderId);
  if (!order) {
    res.status(404).json({ message: "Order not found" });
    return;
  }
  const parsed = updateOrderStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    return;
  }
  const updated = updateOrderStatus(order.id, parsed.data.status);
  res.json(updated);
});

router.post("/orders/:orderId/confirm-payment", async (req: Request, res: Response) => {
  const { paymentId, userEmail } = req.body as { paymentId?: string; userEmail?: string };
  if (!paymentId) {
    res.status(400).json({ message: "paymentId required" });
    return;
  }
  const updated = setOrderPayment(req.params.orderId, paymentId);
  if (!updated) {
    res.status(404).json({ message: "Order not found" });
    return;
  }
  await clearCart(updated.cartId);
  for (const item of updated.items) {
    await decreaseProductStock(item.productId, item.quantity);
  }
  // Invoice creation is now handled via SQS (payment-events queue)
  if (userEmail && typeof userEmail === "string") {
    await sendOrderConfirmationEmail(
      updated.id,
      userEmail,
      updated.totalAmount,
      updated.currency
    );
  }
  const final = getOrder(updated.id);
  res.json(final ?? updated);
});

// Validate shipping country using REST Countries public API
router.get("/orders/validate-country/:code", async (req: Request, res: Response) => {
  const code = req.params.code.trim();
  if (!code || code.length < 2 || code.length > 3) {
    res.status(400).json({ message: "Provide a 2 or 3-letter country code (e.g. US, IE, IN)" });
    return;
  }
  const country = await lookupCountry(code);
  if (!country) {
    res.status(404).json({ valid: false, message: `Country not found for code: ${code}` });
    return;
  }
  res.json({
    valid: true,
    code: code.toUpperCase(),
    country: country.name,
    officialName: country.officialName,
    capital: country.capital,
    region: country.region,
    subregion: country.subregion,
    currencies: country.currencies,
    languages: country.languages,
    population: country.population,
    flag: country.flag,
    timezones: country.timezones,
  });
});

// Get pending orders containing a specific product (used by Products service)
router.get("/orders/by-product/:productId", (req: Request, res: Response) => {
  const productId = req.params.productId;
  const allOrders = getAllOrders();
  const pending = allOrders
    .filter(
      (o) =>
        (o.status === "pending" || o.status === "payment_pending") &&
        o.items.some((i) => i.productId === productId)
    )
    .map((o) => ({
      orderId: o.id,
      quantity: o.items.find((i) => i.productId === productId)?.quantity ?? 0,
    }));
  res.json({
    productId,
    pendingOrders: pending,
    count: pending.length,
  });
});

// Endpoint for SQS consumer to link invoice to order
router.post("/orders/:orderId/set-invoice", (req: Request, res: Response) => {
  const { invoiceId } = req.body as { invoiceId?: string };
  if (!invoiceId) {
    res.status(400).json({ message: "invoiceId required" });
    return;
  }
  const updated = setOrderInvoice(req.params.orderId, invoiceId);
  if (!updated) {
    res.status(404).json({ message: "Order not found" });
    return;
  }
  res.json(updated);
});

export default router;
