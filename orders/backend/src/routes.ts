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
} from "./service";

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
  res.status(201).json(order);
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
  if (parsed.data.status === "paid" && !order.invoiceId) {
    const inv = await createInvoiceForOrder(order.id);
    if (inv) setOrderInvoice(order.id, inv.id);
  }
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
  if (!updated.invoiceId) {
    const inv = await createInvoiceForOrder(updated.id);
    if (inv) setOrderInvoice(updated.id, inv.id);
  }
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

export default router;
