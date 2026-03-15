export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
  sku?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  price?: number;
  name?: string;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  discountCode?: string;
  discountPercent?: number;
  createdAt: string;
  updatedAt: string;
}
