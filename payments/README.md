# Payments -- Payment Processing & Validation API

**Owner**: Ruchitha Erlapally (x24269816)
**Port**: 4004 | **Lambda**: `ecommerce-payments`

## What This Service Does

Processes real payments through **Stripe** using the PaymentIntent flow. Creates payment intents on the server, collects card details on the frontend via Stripe Elements, verifies payment completion, and triggers order fulfillment and invoice generation via SQS.

## Stripe Integration

This service uses the **Stripe PaymentIntent** flow for secure, PCI-compliant payment processing:

```
Frontend                        Backend                          Stripe
   |-- GET /payments/config ------>|                                |
   |<---- publishableKey ---------|                                |
   |                               |                                |
   |-- POST /create-intent ------->|-- paymentIntents.create ------>|
   |<---- clientSecret ------------|<---- clientSecret -------------|
   |                               |                                |
   |-- stripe.confirmCardPayment --|------------------------------->|
   |<---- succeeded ---------------|<-------------------------------|
   |                               |                                |
   |-- POST /confirm-stripe ------>|-- paymentIntents.retrieve ---->|
   |                               |-- POST /orders/confirm-payment |
   |                               |-- SQS: PAYMENT_COMPLETED      |
   |<---- {success, confirmed} ----|                                |
```

### Test Cards

| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | Succeeds |
| `4000 0000 0000 0002` | Declined |
| `4000 0025 0000 3155` | Requires 3D Secure |

Any future expiry, any 3-digit CVC.

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/payments/config` | Get Stripe publishable key for frontend |
| `POST` | `/payments/create-intent` | Create Stripe PaymentIntent + internal record |
| `POST` | `/payments/confirm-stripe` | Verify with Stripe, confirm order, publish event |
| `POST` | `/payments/validate` | Validate payment amount (checks cart total) |
| `POST` | `/payments` | Process payment (legacy, auto-confirms) |
| `GET` | `/payments/:paymentId` | Get payment details |
| `GET` | `/payments/status/:paymentId` | Get payment status |
| `POST` | `/payments/confirm` | Confirm payment (legacy) |

## Inter-Service Communication

| Target Service | Call | Purpose |
|---------------|------|---------|
| **Stripe API** | `paymentIntents.create()` | Create PaymentIntent |
| **Stripe API** | `paymentIntents.retrieve()` | Verify payment succeeded |
| **Orders** (Pavan) | `POST /orders/:id/confirm-payment` | Notify of successful payment |
| **Carts** (Mounika) | `GET /cart/summary/:id` | Validate payment amount matches cart total |
| **SQS** | `ecommerce-payment-events` queue | Publish PAYMENT_COMPLETED event |

## SQS Event Published

```json
{
  "type": "PAYMENT_COMPLETED",
  "orderId": "abc-123",
  "paymentId": "pay-456",
  "amount": 59.98,
  "currency": "USD"
}
```

This event triggers the `payment-processor` Lambda which auto-generates an invoice and links it to the order.

## Data Model

```typescript
type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  stripePaymentIntentId?: string;
  createdAt: string;
  updatedAt: string;
}
```

## Frontend (Stripe Elements)

The payments frontend uses `@stripe/react-stripe-js` and `@stripe/stripe-js` to render a secure card input form. The Stripe publishable key is fetched from the backend at startup.

## Run Locally

```bash
cd payments/backend && npm install && npm run dev    # Backend on :4004
cd payments/frontend && npm install && npm run dev   # Frontend on :3014
```

## Environment Variables

```bash
PORT=4004
ORDERS_SERVICE_URL=http://localhost:4003
CARTS_SERVICE_URL=http://localhost:4002
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
PAYMENT_EVENTS_QUEUE_URL=<sqs-queue-url>
```
