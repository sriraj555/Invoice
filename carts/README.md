# Carts -- Shopping Cart Management API

**Owner**: Mounika Sripathi (x24213934)
**Port**: 4002 | **Lambda**: `ecommerce-carts`

## What This Service Does

Manages shopping carts with full item lifecycle (add, update, remove), discount code support, and the critical **checkout endpoint** that orchestrates order creation and payment validation across services.

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/cart` | Create new cart for a user |
| `GET` | `/cart/:cartId` | Get full cart with calculated totals |
| `GET` | `/cart/summary/:cartId` | Get cart summary (total, itemCount) |
| `POST` | `/cart/:cartId/items` | Add item (validates stock with Products) |
| `PUT` | `/cart/:cartId/items/:productId` | Update item quantity (0 = remove) |
| `DELETE` | `/cart/:cartId/items/:productId` | Remove item from cart |
| `POST` | `/cart/:cartId/discount` | Apply discount code |
| `POST` | `/cart/:cartId/clear` | Clear all items |
| `POST` | `/cart/product-update` | Receive price/name updates from Products |
| `POST` | `/cart/:cartId/checkout` | Checkout: create order + validate payment |

## Checkout Flow (Most Important Endpoint)

```
POST /cart/:cartId/checkout
  1. Validate cart is not empty
  2. Calculate subtotal, apply discount, compute total
  3. Submit order to Orders service -> POST /orders
  4. Validate payment with Payments service -> POST /payments/validate
  5. Return {orderId, orderStatus, totalAmount, paymentValidated}
```

## Inter-Service Communication

| Target Service | Call | Purpose |
|---------------|------|---------|
| **Products** (Jaswanth) | `GET /products/:id` | Fetch product details and validate stock when adding items |
| **Orders** (Pavan) | `POST /orders` | Submit order from cart at checkout |
| **Payments** (Ruchitha) | `POST /payments/validate` | Validate payment amount at checkout |

## Discount Codes

| Code | Discount |
|------|----------|
| `SAVE10` | 10% off |
| `SAVE20` | 20% off |

## Data Model

```typescript
interface Cart {
  id: string;
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price?: number;
    name?: string;
  }>;
  discountCode?: string;
  discountPercent?: number;
  createdAt: string;
  updatedAt: string;
}
```

## Run Locally

```bash
cd carts/backend && npm install && npm run dev    # Backend on :4002
cd carts/frontend && npm install && npm run dev   # Frontend on :3012
```

## Environment Variables

```bash
PORT=4002
PRODUCTS_SERVICE_URL=http://localhost:4001
PAYMENTS_SERVICE_URL=http://localhost:4004
ORDERS_SERVICE_URL=http://localhost:4003
```
