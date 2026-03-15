import { z } from "zod";

const orderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
  name: z.string(),
});

export const createOrderSchema = z.object({
  userId: z.string().min(1),
  cartId: z.string().min(1),
  items: z.array(orderItemSchema).min(1),
  totalAmount: z.number().positive(),
  currency: z.string().length(3).default("USD"),
  shippingAddress: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "pending",
    "payment_pending",
    "paid",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]),
});

export type CreateOrderBody = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusBody = z.infer<typeof updateOrderStatusSchema>;
