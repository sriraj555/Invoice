import type { Order, OrderStatus } from "./types";
import { v4 as uuidv4 } from "uuid";

const orders = new Map<string, Order>();

export function getOrder(orderId: string): Order | undefined {
  return orders.get(orderId);
}

export function getOrdersByUserId(userId: string): Order[] {
  return Array.from(orders.values()).filter((o) => o.userId === userId);
}

export function getAllOrders(): Order[] {
  return Array.from(orders.values());
}

export function createOrder(input: Omit<Order, "id" | "createdAt" | "updatedAt" | "status">): Order {
  const id = uuidv4();
  const now = new Date().toISOString();
  const order: Order = {
    ...input,
    id,
    status: "payment_pending",
    createdAt: now,
    updatedAt: now,
  };
  orders.set(id, order);
  return order;
}

export function updateOrderStatus(orderId: string, status: OrderStatus): Order | undefined {
  const order = orders.get(orderId);
  if (!order) return undefined;
  order.status = status;
  order.updatedAt = new Date().toISOString();
  return order;
}

export function setOrderPayment(orderId: string, paymentId: string): Order | undefined {
  const order = orders.get(orderId);
  if (!order) return undefined;
  order.paymentId = paymentId;
  order.status = "paid";
  order.updatedAt = new Date().toISOString();
  return order;
}

export function setOrderInvoice(orderId: string, invoiceId: string): Order | undefined {
  const order = orders.get(orderId);
  if (!order) return undefined;
  order.invoiceId = invoiceId;
  order.updatedAt = new Date().toISOString();
  return order;
}
