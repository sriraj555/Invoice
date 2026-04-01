import { Router, Request, Response } from "express";
import {
  getCart,
  getOrCreateCart,
  addItem,
  updateItem,
  removeItem,
  applyDiscount,
  getDiscountPercent,
  clearCart,
  updateProductInCarts,
} from "./store";
import { addCartItemSchema, updateCartItemSchema, applyDiscountSchema } from "./validation";
import { fetchProduct, validatePaymentForCheckout, submitOrderFromCart, convertCurrency } from "./service";

const router = Router();

function subtotal(items: Array<{ quantity: number; price?: number }>): number {
  return items.reduce((sum, i) => sum + (i.price ?? 0) * i.quantity, 0);
}

router.get("/cart/:cartId", (req: Request, res: Response) => {
  const cart = getCart(req.params.cartId);
  if (!cart) {
    res.status(404).json({ message: "Cart not found" });
    return;
  }
  const sub = subtotal(cart.items);
  const discount = cart.discountPercent ? (sub * cart.discountPercent) / 100 : 0;
  res.json({
    ...cart,
    subtotal: sub,
    discountAmount: discount,
    total: Math.max(0, sub - discount),
  });
});

router.get("/cart/summary/:cartId", (req: Request, res: Response) => {
  const cart = getCart(req.params.cartId);
  if (!cart) {
    res.status(404).json({ message: "Cart not found" });
    return;
  }
  const sub = subtotal(cart.items);
  const discount = cart.discountPercent ? (sub * cart.discountPercent) / 100 : 0;
  res.json({
    cartId: cart.id,
    itemCount: cart.items.reduce((s, i) => s + i.quantity, 0),
    subtotal: sub,
    discountCode: cart.discountCode,
    discountPercent: cart.discountPercent,
    discountAmount: discount,
    total: Math.max(0, sub - discount),
  });
});

router.post("/cart", (req: Request, res: Response) => {
  const userId = (req.body?.userId as string) ?? "anonymous";
  const cart = getOrCreateCart(userId);
  res.status(201).json(cart);
});

router.post("/cart/:cartId/items", async (req: Request, res: Response) => {
  const cart = getCart(req.params.cartId);
  if (!cart) {
    res.status(404).json({ message: "Cart not found" });
    return;
  }
  const parsed = addCartItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    return;
  }
  const product = await fetchProduct(parsed.data.productId);
  if (!product) {
    res.status(404).json({ message: "Product not found" });
    return;
  }
  if (product.stock < parsed.data.quantity) {
    res.status(400).json({ message: "Insufficient stock", available: product.stock });
    return;
  }
  const updated = addItem(cart.id, {
    productId: product.id,
    quantity: parsed.data.quantity,
    price: product.price,
    name: product.name,
  });
  res.json(updated);
});

router.put("/cart/:cartId/items/:productId", (req: Request, res: Response) => {
  const parsed = updateCartItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    return;
  }
  const updated = updateItem(req.params.cartId, req.params.productId, parsed.data.quantity);
  if (!updated) {
    res.status(404).json({ message: "Cart or item not found" });
    return;
  }
  if (parsed.data.quantity === 0) {
    res.json({ ...updated, removed: true });
    return;
  }
  res.json(updated);
});

router.delete("/cart/:cartId/items/:productId", (req: Request, res: Response) => {
  const updated = removeItem(req.params.cartId, req.params.productId);
  if (!updated) {
    res.status(404).json({ message: "Cart or item not found" });
    return;
  }
  res.json(updated);
});

router.post("/cart/:cartId/discount", (req: Request, res: Response) => {
  const parsed = applyDiscountSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    return;
  }
  const updated = applyDiscount(req.params.cartId, parsed.data.code);
  if (!updated) {
    res.status(400).json({ message: "Cart not found or invalid discount code" });
    return;
  }
  res.json(updated);
});

router.post("/cart/:cartId/clear", (req: Request, res: Response) => {
  const ok = clearCart(req.params.cartId);
  if (!ok) {
    res.status(404).json({ message: "Cart not found" });
    return;
  }
  res.json({ message: "Cart cleared" });
});

// Receive product price/name updates from Products service
router.post("/cart/product-update", (req: Request, res: Response) => {
  const { productId, price, name } = req.body as {
    productId?: string;
    price?: number;
    name?: string;
  };
  if (!productId || price === undefined || name === undefined) {
    res.status(400).json({ message: "productId, price, and name are required" });
    return;
  }
  const count = updateProductInCarts(productId, price, name);
  res.json({ message: "Product updated in carts", cartsUpdated: count });
});

// Convert cart total to other currencies via Frankfurter public API
router.get("/cart/:cartId/convert", async (req: Request, res: Response) => {
  const cart = getCart(req.params.cartId);
  if (!cart) {
    res.status(404).json({ message: "Cart not found" });
    return;
  }
  const to = (req.query.to as string)?.trim();
  if (!to) {
    res.status(400).json({ message: "Query param 'to' required (e.g. ?to=EUR,GBP)" });
    return;
  }
  const sub = subtotal(cart.items);
  const discount = cart.discountPercent ? (sub * cart.discountPercent) / 100 : 0;
  const total = Math.max(0, sub - discount);
  if (total === 0) {
    res.json({ cartId: cart.id, total: 0, currency: "USD", converted: {} });
    return;
  }
  const targets = to.split(",").map((c) => c.trim().toUpperCase()).filter((c) => c.length === 3);
  const result = await convertCurrency(total, "USD", targets);
  if (!result) {
    res.status(502).json({ message: "Currency conversion service unavailable" });
    return;
  }
  res.json({
    cartId: cart.id,
    total,
    currency: "USD",
    converted: result.rates,
  });
});

// Checkout: validate payment + create order from cart
router.post("/cart/:cartId/checkout", async (req: Request, res: Response) => {
  const cart = getCart(req.params.cartId);
  if (!cart) {
    res.status(404).json({ message: "Cart not found" });
    return;
  }
  if (cart.items.length === 0) {
    res.status(400).json({ message: "Cart is empty" });
    return;
  }

  const { userId, currency } = req.body as { userId?: string; currency?: string };
  const cur = (currency ?? "USD").toUpperCase();
  const sub = cart.items.reduce((sum, i) => sum + (i.price ?? 0) * i.quantity, 0);
  const discount = cart.discountPercent ? (sub * cart.discountPercent) / 100 : 0;
  const total = Math.max(0, sub - discount);

  // Step 1: Submit order to Orders service (Carts → Orders)
  const orderPayload = {
    userId: userId ?? cart.userId,
    cartId: cart.id,
    items: cart.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      price: i.price ?? 0,
      name: i.name ?? i.productId,
    })),
    totalAmount: total,
    currency: cur,
  };

  let order: { id: string; status: string } | null = null;
  try {
    order = await submitOrderFromCart(orderPayload);
  } catch (e) {
    res.status(502).json({
      message: "Failed to create order",
      detail: e instanceof Error ? e.message : "Unknown error",
    });
    return;
  }

  // Step 2: Validate payment via Payments service (Carts → Payments)
  let paymentValid = false;
  try {
    paymentValid = await validatePaymentForCheckout(order.id, total, cur, cart.id);
  } catch {
    // Payment validation failed, but order was created — return partial result
  }

  res.json({
    message: "Checkout initiated",
    orderId: order.id,
    orderStatus: order.status,
    totalAmount: total,
    currency: cur,
    paymentValidated: paymentValid,
    cartId: cart.id,
  });
});

export default router;
