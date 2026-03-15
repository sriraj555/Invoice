export type OrderStatus =
  | "pending"
  | "payment_pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  userId: string;
  cartId: string;
  items: Array<{ productId: string; quantity: number; price: number; name: string }>;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  paymentId?: string;
  invoiceId?: string;
  shippingAddress?: string;
  createdAt: string;
  updatedAt: string;
}
