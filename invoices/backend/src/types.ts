export interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  sku?: string;
}

export interface Invoice {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  items: InvoiceItem[];
  pdfUrl?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  cartId: string;
  items: Array<{ productId: string; quantity: number; price: number; name: string }>;
  totalAmount: number;
  currency: string;
  status: string;
  paymentId?: string;
  invoiceId?: string;
  shippingAddress?: string;
  createdAt: string;
  updatedAt: string;
}
