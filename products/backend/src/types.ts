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
