# Orders -- Order Processing & Management API

**Owner**: Pavan Sai Bodduluru (x24211371)
**Port**: 4003 | **Lambda**: `ecommerce-orders`

## What This Service Does

Handles the entire order lifecycle from creation to delivery. Validates stock, publishes events to SQS for async processing, confirms payments, clears carts, reserves inventory, and sends email notifications. The central orchestrator of post-payment fulfillment.

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/orders` | Create order (validates stock, publishes to SQS) |
| `GET` | `/orders` | List all orders (filter by `?userId=`) |
| `GET` | `/orders/:orderId` | Get order details |
| `PUT` | `/orders/:orderId` | Update order status |
| `POST` | `/orders/:orderId/confirm-payment` | Confirm payment (clear cart, decrease stock, email) |
| `GET` | `/orders/by-product/:productId` | Get pending orders containing a product |
| `POST` | `/orders/:orderId/set-invoice` | Link invoice to order (called by SQS consumer) |

## Order Status Flow

```
pending -> payment_pending -> paid -> processing -> shipped -> delivered
                                 \-> cancelled
```

## Payment Confirmation Flow (Most Critical)

```
POST /orders/:orderId/confirm-payment {paymentId, userEmail?}
  1. Link payment to order (status -> "paid")
  2. Clear associated cart -> POST /cart/:cartId/clear
  3. Decrease stock for each item -> POST /products/:id/decrease-stock
  4. Send order confirmation email (SendGrid or Mailgun)
  5. Return updated order
```

## Inter-Service Communication

| Target Service | Call | Purpose |
|---------------|------|---------|
| **Products** (Jaswanth) | `POST /products/inventory/check` | Validate stock before order creation |
| **Products** (Jaswanth) | `POST /products/:id/decrease-stock` | Reserve inventory after payment |
| **Carts** (Mounika) | `POST /cart/:id/clear` | Clear cart after successful payment |
| **Payments** (Ruchitha) | `POST /payments/validate` | Validate payment amount |
| **SQS** | `ecommerce-order-events` queue | Publish ORDER_CREATED event |
| **SendGrid/Mailgun** | Email API | Send order confirmation |

## SQS Event Published

```json
{
  "type": "ORDER_CREATED",
  "orderId": "abc-123",
  "userId": "user-1",
  "cartId": "cart-1",
  "totalAmount": 59.98,
  "currency": "USD",
  "items": [{"productId": "p1", "quantity": 2, "price": 29.99, "name": "Wireless Mouse"}]
}
```

## Data Model

```typescript
type OrderStatus = "pending" | "payment_pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";

interface Order {
  id: string;
  userId: string;
  cartId: string;
  items: Array<{productId: string; quantity: number; price: number; name: string}>;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  paymentId?: string;
  invoiceId?: string;
  shippingAddress?: string;
  createdAt: string;
  updatedAt: string;
}
```

## Run Locally

```bash
cd orders/backend && npm install && npm run dev    # Backend on :4003
cd orders/frontend && npm install && npm run dev   # Frontend on :3013
```

## Environment Variables

```bash
PORT=4003
PRODUCTS_SERVICE_URL=http://localhost:4001
CARTS_SERVICE_URL=http://localhost:4002
PAYMENTS_SERVICE_URL=http://localhost:4004
INVOICES_SERVICE_URL=http://localhost:4005
ORDER_EVENTS_QUEUE_URL=<sqs-queue-url>
SENDGRID_API_KEY=<optional>
SENDGRID_FROM=<optional>
MAILGUN_API_KEY=<optional>
MAILGUN_DOMAIN=<optional>
MAILGUN_FROM=<optional>
```
