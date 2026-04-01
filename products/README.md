# Products -- Product Catalog & Inventory API

**Owner**: Jaswanth Neyigapula (x23420464)
**Port**: 4001 | **Lambda**: `ecommerce-products`

## What This Service Does

Manages the complete product catalog for the e-commerce platform. Handles CRUD operations, real-time inventory tracking, price validation using a public API (Frankfurter), and product recommendations from a classmate's API.

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/products` | List all products |
| `GET` | `/products/:id` | Get product by ID |
| `POST` | `/products` | Create new product |
| `PUT` | `/products/:id` | Update product (notifies Carts service) |
| `DELETE` | `/products/:id` | Delete product (blocks if pending orders exist) |
| `POST` | `/products/inventory/check` | Check stock availability |
| `POST` | `/products/:id/decrease-stock` | Reserve inventory |
| `POST` | `/products/:id/release-stock` | Release reserved inventory |
| `POST` | `/products/validate-price` | Validate price via Frankfurter API |
| `GET` | `/recommendations` | Get product recommendations (classmate API) |

## Inter-Service Communication

| Target Service | Call | Purpose |
|---------------|------|---------|
| **Carts** (Mounika) | `POST /cart/product-update` | Notify all carts when a product's price or name changes |
| **Orders** (Pavan) | `GET /orders/by-product/:id` | Check for pending orders before allowing product deletion |
| **Frankfurter API** | `GET /latest?from=&to=` | Public API for currency exchange rate validation |

## Data Model

```typescript
interface Product {
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
```

## Seed Data

| ID | Product | Price | Stock |
|----|---------|-------|-------|
| `p1` | Wireless Mouse | $29.99 | 100 |
| `p2` | USB-C Hub | $49.99 | 50 |

## Run Locally

```bash
cd products/backend && npm install && npm run dev    # Backend on :4001
cd products/frontend && npm install && npm run dev   # Frontend on :3011
```

## Environment Variables

```bash
PORT=4001
CARTS_SERVICE_URL=http://localhost:4002
ORDERS_SERVICE_URL=http://localhost:4003
PUBLIC_EXCHANGE_API=https://api.frankfurter.dev
```
