# E-Commerce Microservices Platform

## Scalable Cloud Programming - H9SCPRO1

**National College of Ireland**

| Student | Student ID | Service Owned | Role |
|---------|-----------|---------------|------|
| **Jaswanth Neyigapula** | x23420464 | Product Catalog & Inventory API | Products + Gateway |
| **Mounika Sripathi** | x24213934 | Shopping Cart Management API | Carts |
| **Pavan Sai Bodduluru** | x24211371 | Order Processing & Management API | Orders |
| **Ruchitha Erlapally** | x24269816 | Payment Processing & Validation API | Payments (Stripe) |
| **Sriraj Gannavaram** | x24331873 | Invoice & Receipt Generator API | Invoices (PDF) |

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Live Deployed URLs](#live-deployed-urls)
4. [Technology Stack](#technology-stack)
5. [Service Details](#service-details)
6. [Inter-Service Communication](#inter-service-communication)
7. [SQS Event-Driven Processing](#sqs-event-driven-processing)
8. [Stripe Payment Integration](#stripe-payment-integration)
9. [Complete API Reference](#complete-api-reference)
10. [Data Models](#data-models)
11. [End-to-End Checkout Flow](#end-to-end-checkout-flow)
12. [Local Development Setup](#local-development-setup)
13. [AWS Deployment](#aws-deployment)
14. [Testing](#testing)
15. [Project Structure](#project-structure)

---

## Project Overview

This is a **cloud-native e-commerce platform** built using a **microservices architecture**. The system consists of **6 independent backend services**, a **central API Gateway**, **5 React frontend applications**, and **2 SQS-driven event consumers** -- all deployed on **AWS Lambda + API Gateway** with **S3** for frontend hosting.

Each team member independently developed, tested, and deployed their own service to their individual **AWS Learner Lab account**, demonstrating real-world distributed system design.

### What Makes This Project Stand Out

- **Real Stripe Payments** -- Not mocked. Actual Stripe PaymentIntent flow with card collection via Stripe Elements.
- **Asynchronous Event Processing** -- AWS SQS queues decouple order creation from payment processing and invoice generation.
- **PDF Invoice Generation** -- Dynamic invoice PDFs generated on-the-fly using PDFKit.
- **Cross-Account Deployment** -- Services distributed across 5 separate AWS accounts communicating via HTTPS.
- **Public API Integration** -- Frankfurter Currency Exchange API for price validation.
- **Classmate API Integration** -- Product Recommendations API from another team.
- **71 Automated Test Cases** -- Comprehensive end-to-end test suite.

---

## Architecture

```
                         +---------------------------+
                         |     FRONTEND APPS (S3)    |
                         |  Products | Carts | Orders|
                         |  Payments | Invoices      |
                         +------------+--------------+
                                      |
                                      v
                     +----------------------------------+
                     |   API GATEWAY (Lambda + APIGW)   |
                     |  Routes /api-backend/* requests   |
                     +--+-----+-----+------+-----+-----+
                        |     |     |      |     |
           +------------+  +--+--+  +--+---+ +---+---+ +---+----+
           |               |     |  |      | |       | |        |
     +-----v------+  +----v---+ +--v----+ +-v------+ +v-------+
     |  PRODUCTS   |  |  CARTS | | ORDERS| |PAYMENTS| |INVOICES|
     |  Port 4001  |  |  4002  | |  4003 | |  4004  | |  4005  |
     | (Jaswanth)  |  |(Mounika)| | (Pavan)| |(Ruchitha)|(Sriraj)|
     +------+------+  +---+----+ +---+---+ +---+----+ +---+----+
            |              |          |         |          |
            +---------+----+----+-----+---------+----------+
                      |         |               |
                +-----v---+ +---v--------+ +----v----------+
                |Frankfurter| |  AWS SQS   | | Stripe API   |
                |  API     | | (2 queues) | | (Payments)   |
                +----------+ +-----+------+ +--------------+
                                   |
                      +------------+------------+
                      |                         |
              +-------v--------+   +------------v---------+
              | order-processor|   | payment-processor    |
              | (Lambda)       |   | (Lambda)             |
              | Auto-pay orders|   | Auto-generate invoice|
              +----------------+   +----------------------+
```

### Service Communication Map

```
Products ----> Carts (notify price/name changes)
Products ----> Orders (check pending orders before delete)
Products ----> Frankfurter API (currency validation)

Carts -------> Products (fetch product details, validate stock)
Carts -------> Orders (submit order at checkout)
Carts -------> Payments (validate payment at checkout)

Orders ------> Products (validate stock, decrease stock)
Orders ------> Carts (clear cart after payment)
Orders ------> Payments (validate payment amount)
Orders ------> SQS: ORDER_CREATED event

Payments ----> Stripe API (create PaymentIntent, verify payment)
Payments ----> Orders (confirm payment success)
Payments ----> Carts (get cart summary for validation)
Payments ----> SQS: PAYMENT_COMPLETED event

Invoices ----> Orders (fetch order details)
Invoices ----> Products (fetch product SKU)

SQS order-processor -----> Payments (auto-create payment)
SQS payment-processor ---> Invoices (generate invoice)
SQS payment-processor ---> Orders (link invoice to order)
```

---

## Live Deployed URLs

### Backend APIs (AWS Lambda + API Gateway -- Permanent URLs)

| Service | Owner | API URL |
|---------|-------|---------|
| **Gateway** | Jaswanth | https://d9zh40m2a0.execute-api.us-east-1.amazonaws.com |
| **Products** | Jaswanth | https://wxonmltxb8.execute-api.us-east-1.amazonaws.com |
| **Carts** | Mounika | https://2mtlux9id0.execute-api.us-east-1.amazonaws.com |
| **Orders** | Pavan | https://liuimbxa1c.execute-api.us-east-1.amazonaws.com |
| **Payments** | Ruchitha | https://occbwj6fr2.execute-api.us-east-1.amazonaws.com |
| **Invoices** | Sriraj | https://gogezjb1n6.execute-api.us-east-1.amazonaws.com |

### Frontend Apps (S3 Static Website Hosting)

| Service | Owner | Frontend URL |
|---------|-------|-------------|
| **Products** | Jaswanth | http://products-frontend-851725276040.s3-website-us-east-1.amazonaws.com |
| **Carts** | Mounika | http://carts-frontend-238811450261.s3-website-us-east-1.amazonaws.com |
| **Orders** | Pavan | http://orders-frontend-533267029271.s3-website-us-east-1.amazonaws.com |
| **Payments** | Ruchitha | http://payments-frontend-992382686490.s3-website-us-east-1.amazonaws.com |
| **Invoices** | Sriraj | http://invoices-frontend-992382686490.s3-website-us-east-1.amazonaws.com |

### SQS Queues

| Queue | Account | Purpose |
|-------|---------|---------|
| `ecommerce-order-events` | Pavan | Triggers auto-payment after order creation |
| `ecommerce-payment-events` | Ruchitha | Triggers auto-invoice after payment completion |

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js 18.x |
| **Language** | TypeScript (strict mode) |
| **Backend Framework** | Express.js |
| **Frontend Framework** | React 18 + Vite |
| **API Validation** | Zod (schema-based validation) |
| **Payment Processing** | Stripe (PaymentIntent + Elements) |
| **PDF Generation** | PDFKit |
| **Message Queue** | AWS SQS |
| **Serverless Adapter** | serverless-http |
| **Compute** | AWS Lambda |
| **API Routing** | AWS API Gateway (HTTP) |
| **Frontend Hosting** | AWS S3 (static website) |
| **Public API** | Frankfurter (currency exchange rates) |
| **ID Generation** | uuid v4 |
| **Styling** | CSS (custom dark theme) |

---

## Service Details

### 1. Product Catalog & Inventory API (Jaswanth)

**Port**: 4001 | **Lambda**: `ecommerce-products` | **Profile**: `jaswanth`

Manages the product catalog, stock levels, and pricing. Provides inventory validation to Orders, and notifies Carts when products change.

**Key Features**:
- CRUD operations for products
- Real-time inventory tracking (stock check, decrease, release)
- Price validation via Frankfurter public API
- Product recommendations from classmate API
- Auto-notifies Carts service on price/name changes
- Blocks product deletion when pending orders exist
- Seed data: Wireless Mouse ($29.99, 100 stock), USB-C Hub ($49.99, 50 stock)

**Endpoints**: 10 endpoints (see [API Reference](#products-api))

**Connects To**:
- Carts API (notify product updates)
- Orders API (check pending orders)
- Frankfurter API (currency validation)
- Classmate Recommendations API

---

### 2. Shopping Cart Management API (Mounika)

**Port**: 4002 | **Lambda**: `ecommerce-carts` | **Profile**: `mounika`

Manages shopping carts with item management, discount codes, and the critical checkout flow that bridges Cart -> Orders -> Payments.

**Key Features**:
- Cart creation per user
- Add/update/remove items with stock validation
- Discount codes: `SAVE10` (10% off), `SAVE20` (20% off)
- Cart summary with subtotal, discount, and total calculations
- Checkout endpoint that orchestrates order creation + payment validation
- Receives product price updates from Products service

**Endpoints**: 10 endpoints (see [API Reference](#carts-api))

**Connects To**:
- Products API (fetch product details and stock)
- Orders API (submit order at checkout)
- Payments API (validate payment at checkout)

---

### 3. Order Processing & Management API (Pavan)

**Port**: 4003 | **Lambda**: `ecommerce-orders` | **Profile**: `pavan`

Handles the full order lifecycle from creation to delivery. Orchestrates post-payment fulfillment (clear cart, decrease stock, send email, link invoice).

**Key Features**:
- Order creation with stock validation for each item
- Order status tracking: `pending` -> `payment_pending` -> `paid` -> `processing` -> `shipped` -> `delivered`
- Payment confirmation flow (clears cart, reserves stock, sends email)
- Invoice linking via SQS consumer
- Email notifications via SendGrid or Mailgun
- SQS event publishing for asynchronous processing

**Endpoints**: 7 endpoints (see [API Reference](#orders-api))

**Connects To**:
- Products API (validate stock, decrease stock)
- Carts API (clear cart after payment)
- Payments API (validate payment amount)
- SQS: publishes `ORDER_CREATED` events
- SendGrid/Mailgun (email notifications)

---

### 4. Payment Processing & Validation API (Ruchitha)

**Port**: 4004 | **Lambda**: `ecommerce-payments` | **Profile**: `ruchitha`

Processes real payments through **Stripe**. Supports the full PaymentIntent flow: create intent, collect card details on the frontend via Stripe Elements, confirm payment, and trigger order fulfillment.

**Key Features**:
- **Real Stripe integration** with PaymentIntent flow
- Stripe publishable key endpoint for frontend initialization
- Payment amount validation against cart totals
- Minimum amount enforcement per currency (USD >= $0.50, EUR >= 0.50, GBP >= 0.30)
- Payment status tracking
- SQS event publishing for async invoice generation
- Backward-compatible legacy endpoints

**Endpoints**: 8 endpoints (see [API Reference](#payments-api))

**Connects To**:
- Stripe API (create/verify PaymentIntents)
- Orders API (confirm payment success)
- Carts API (validate cart total)
- SQS: publishes `PAYMENT_COMPLETED` events

---

### 5. Invoice & Receipt Generator API (Sriraj)

**Port**: 4005 | **Lambda**: `ecommerce-invoices` | **Profile**: `sriraj`

Generates invoices and downloadable PDF receipts. Fetches order details and product information to create itemized invoices with proper formatting.

**Key Features**:
- Invoice creation from order ID (auto-fetches order details)
- PDF generation using PDFKit (A4 format)
- Invoice PDFs include: invoice number, order ID, date, itemized list, totals
- Lookup by order ID or invoice ID
- Test PDF endpoint for verification

**Endpoints**: 5 endpoints (see [API Reference](#invoices-api))

**Connects To**:
- Orders API (fetch order details)
- Products API (fetch product SKU for line items)

---

## Inter-Service Communication

All services communicate via **REST HTTP calls** using the native `fetch` API. Each service has an `httpClient.ts` utility and a `service.ts` file that encapsulates outbound calls.

### Communication Table

| From | To | Endpoint Called | Purpose |
|------|----|----------------|---------|
| Products | Carts | `POST /cart/product-update` | Notify price/name changes |
| Products | Orders | `GET /orders/by-product/:id` | Check pending orders before delete |
| Products | Frankfurter | `GET /latest?from=&to=` | Currency validation |
| Carts | Products | `GET /products/:id` | Fetch product details + stock |
| Carts | Orders | `POST /orders` | Submit order at checkout |
| Carts | Payments | `POST /payments/validate` | Validate payment at checkout |
| Orders | Products | `POST /products/inventory/check` | Validate stock before order |
| Orders | Products | `POST /products/:id/decrease-stock` | Reserve inventory after payment |
| Orders | Carts | `POST /cart/:id/clear` | Clear cart after payment |
| Orders | Payments | `POST /payments/validate` | Validate payment amount |
| Payments | Stripe | `paymentIntents.create()` | Create PaymentIntent |
| Payments | Stripe | `paymentIntents.retrieve()` | Verify payment status |
| Payments | Orders | `POST /orders/:id/confirm-payment` | Confirm payment success |
| Payments | Carts | `GET /cart/summary/:id` | Get cart total for validation |
| Invoices | Orders | `GET /orders/:id` | Fetch order details |
| Invoices | Products | `GET /products/:id` | Fetch product SKU |

---

## SQS Event-Driven Processing

The system uses **AWS SQS** for asynchronous event processing, enabling loose coupling between services.

### Queue 1: Order Events

```
Orders Service                    order-processor Lambda           Payments Service
     |                                    |                              |
     |-- ORDER_CREATED event -->  SQS --> |                              |
     |                                    |-- POST /payments ----------->|
     |                                    |   (auto-create payment)      |
```

**Queue**: `ecommerce-order-events` (Pavan's account)
**Publisher**: Orders Service (on order creation)
**Consumer**: `ecommerce-order-processor` Lambda

**Event Payload**:
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

### Queue 2: Payment Events

```
Payments Service             payment-processor Lambda         Invoices + Orders
     |                                |                              |
     |-- PAYMENT_COMPLETED --> SQS -> |                              |
     |                                |-- POST /invoices ----------->| (create invoice)
     |                                |-- POST /orders/:id/set-invoice ->| (link to order)
```

**Queue**: `ecommerce-payment-events` (Ruchitha's account)
**Publisher**: Payments Service (on payment success)
**Consumer**: `ecommerce-payment-processor` Lambda

**Event Payload**:
```json
{
  "type": "PAYMENT_COMPLETED",
  "orderId": "abc-123",
  "paymentId": "pay-456",
  "amount": 59.98,
  "currency": "USD"
}
```

---

## Stripe Payment Integration

The Payments service integrates with **Stripe** for real payment processing using the **PaymentIntent** flow.

### How It Works

```
Frontend (React)                    Backend (Lambda)                 Stripe
     |                                    |                            |
     |-- 1. GET /payments/config -------->|                            |
     |<---- publishableKey ---------------|                            |
     |                                    |                            |
     |-- 2. POST /payments/create-intent->|                            |
     |                                    |-- paymentIntents.create -->|
     |                                    |<---- clientSecret ---------|
     |<---- clientSecret, paymentId ------|                            |
     |                                    |                            |
     |-- 3. stripe.confirmCardPayment ----|--------------------------->|
     |   (card: 4242 4242 4242 4242)      |                            |
     |<---- paymentIntent (succeeded) ----|<---------------------------|
     |                                    |                            |
     |-- 4. POST /payments/confirm-stripe>|                            |
     |                                    |-- paymentIntents.retrieve->|
     |                                    |<---- status: succeeded ----|
     |                                    |                            |
     |                                    |-- POST /orders/:id/confirm-payment
     |                                    |-- SQS: PAYMENT_COMPLETED
     |<---- { success, orderConfirmed } --|                            |
```

### Test Card Numbers

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | Payment succeeds |
| `4000 0000 0000 0002` | Payment declined |
| `4000 0025 0000 3155` | Requires 3D Secure authentication |

Use any future expiry date and any 3-digit CVC.

---

## Complete API Reference

### Gateway API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `*` | `/api-backend/products*` | Proxy to Products service |
| `*` | `/api-backend/cart*` | Proxy to Carts service |
| `*` | `/api-backend/orders*` | Proxy to Orders service |
| `*` | `/api-backend/payments*` | Proxy to Payments service |
| `*` | `/api-backend/invoices*` | Proxy to Invoices service |
| `GET` | `/health` | Health check |

### Products API

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|-------------|
| `GET` | `/products` | List all products | -- |
| `GET` | `/products/:id` | Get product by ID | -- |
| `POST` | `/products` | Create product | `{name, price, stock, description, currency, sku?}` |
| `PUT` | `/products/:id` | Update product | `{name?, price?, stock?, description?, currency?, sku?}` |
| `DELETE` | `/products/:id` | Delete product | -- |
| `POST` | `/products/inventory/check` | Check stock | `{productId, quantity}` |
| `POST` | `/products/:id/decrease-stock` | Decrease stock | `{quantity}` |
| `POST` | `/products/:id/release-stock` | Release stock | `{quantity}` |
| `POST` | `/products/validate-price` | Validate price | `{amount, currency}` |
| `GET` | `/recommendations` | Get recommendations | -- |

### Carts API

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|-------------|
| `POST` | `/cart` | Create cart | `{userId}` |
| `GET` | `/cart/:cartId` | Get cart with totals | -- |
| `GET` | `/cart/summary/:cartId` | Get cart summary | -- |
| `POST` | `/cart/:cartId/items` | Add item | `{productId, quantity}` |
| `PUT` | `/cart/:cartId/items/:productId` | Update quantity | `{quantity}` |
| `DELETE` | `/cart/:cartId/items/:productId` | Remove item | -- |
| `POST` | `/cart/:cartId/discount` | Apply discount | `{code}` |
| `POST` | `/cart/:cartId/clear` | Clear cart | -- |
| `POST` | `/cart/product-update` | Receive product update | `{productId, price, name}` |
| `POST` | `/cart/:cartId/checkout` | Checkout | `{userId?, currency?}` |

### Orders API

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|-------------|
| `POST` | `/orders` | Create order | `{userId, cartId, items[], totalAmount, currency}` |
| `GET` | `/orders` | List orders | Query: `?userId=` |
| `GET` | `/orders/:orderId` | Get order | -- |
| `PUT` | `/orders/:orderId` | Update status | `{status}` |
| `POST` | `/orders/:orderId/confirm-payment` | Confirm payment | `{paymentId, userEmail?}` |
| `GET` | `/orders/by-product/:productId` | Pending orders for product | -- |
| `POST` | `/orders/:orderId/set-invoice` | Link invoice | `{invoiceId}` |

### Payments API

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|-------------|
| `GET` | `/payments/config` | Get Stripe publishable key | -- |
| `POST` | `/payments/create-intent` | Create Stripe PaymentIntent | `{orderId, amount, currency, cartId?, userEmail?}` |
| `POST` | `/payments/confirm-stripe` | Confirm Stripe payment | `{paymentIntentId, paymentId, orderId, userEmail?}` |
| `POST` | `/payments/validate` | Validate payment | `{orderId, amount, currency, cartId?}` |
| `POST` | `/payments` | Process payment (legacy) | `{orderId, amount, currency, cartId?, userEmail?}` |
| `GET` | `/payments/:paymentId` | Get payment | -- |
| `GET` | `/payments/status/:paymentId` | Get status | -- |
| `POST` | `/payments/confirm` | Confirm payment (legacy) | `{paymentId, orderId}` |

### Invoices API

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|-------------|
| `POST` | `/invoices` | Create invoice | `{orderId}` |
| `GET` | `/invoices/order/:orderId` | Get by order ID | -- |
| `GET` | `/invoices/:invoiceId` | Get by invoice ID | -- |
| `GET` | `/invoices/:invoiceId/pdf` | Download PDF | -- |
| `GET` | `/test-pdf` | Test PDF generation | -- |

---

## Data Models

### Product
```typescript
{
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;     // "USD", "EUR", "GBP"
  stock: number;
  sku?: string;
  createdAt: string;    // ISO 8601
  updatedAt: string;
}
```

### Cart
```typescript
{
  id: string;
  userId: string;
  items: [{
    productId: string;
    quantity: number;
    price?: number;
    name?: string;
  }];
  discountCode?: string;    // "SAVE10" or "SAVE20"
  discountPercent?: number; // 10 or 20
  createdAt: string;
  updatedAt: string;
}
```

### Order
```typescript
{
  id: string;
  userId: string;
  cartId: string;
  items: [{
    productId: string;
    quantity: number;
    price: number;
    name: string;
  }];
  totalAmount: number;
  currency: string;
  status: "pending" | "payment_pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentId?: string;
  invoiceId?: string;
  shippingAddress?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Payment
```typescript
{
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "refunded";
  stripePaymentIntentId?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Invoice
```typescript
{
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  items: [{
    name: string;
    quantity: number;
    price: number;
    sku?: string;
  }];
  pdfUrl?: string;
  createdAt: string;
}
```

---

## End-to-End Checkout Flow

This is the complete flow when a customer makes a purchase:

### Step 1: Browse Products
User opens Products frontend, views catalog (Wireless Mouse $29.99, USB-C Hub $49.99).

### Step 2: Create Cart & Add Items
```
User -> Carts: POST /cart {userId: "john"}
User -> Carts: POST /cart/:id/items {productId: "p1", quantity: 2}
  Carts -> Products: GET /products/p1 (validate stock, get price)
User -> Carts: POST /cart/:id/discount {code: "SAVE10"}
  Cart total: (2 x $29.99) - 10% = $53.98
```

### Step 3: Checkout (Cart -> Order + Payment Validation)
```
User -> Carts: POST /cart/:id/checkout {currency: "USD"}
  Carts -> Orders: POST /orders (creates order with status "payment_pending")
    Orders -> Products: POST /products/inventory/check (for each item)
    Orders -> Payments: POST /payments/validate (validate amount)
    Orders -> SQS: ORDER_CREATED event
  Carts -> Payments: POST /payments/validate (validate payment)
```

### Step 4: Pay with Stripe
```
User -> Payments: GET /payments/config (get Stripe publishable key)
User -> Payments: POST /payments/create-intent {orderId, amount: 53.98, currency: "USD"}
  Payments -> Stripe: paymentIntents.create({amount: 5398, currency: "usd"})
  Returns clientSecret to frontend

User -> Stripe.js: confirmCardPayment(clientSecret, {card: 4242...})
  Stripe processes card payment

User -> Payments: POST /payments/confirm-stripe {paymentIntentId, paymentId, orderId}
  Payments -> Stripe: paymentIntents.retrieve() (verify succeeded)
  Payments -> Orders: POST /orders/:id/confirm-payment {paymentId}
    Orders -> Carts: POST /cart/:id/clear (clear cart)
    Orders -> Products: POST /products/p1/decrease-stock {quantity: 2}
    Orders -> SendGrid/Mailgun: send confirmation email
  Payments -> SQS: PAYMENT_COMPLETED event
```

### Step 5: Auto-Invoice via SQS
```
SQS -> payment-processor Lambda: PAYMENT_COMPLETED event
  Lambda -> Invoices: POST /invoices {orderId}
    Invoices -> Orders: GET /orders/:id (fetch order details)
    Invoices -> Products: GET /products/p1 (fetch SKU)
    Invoices: generates PDF with PDFKit
  Lambda -> Orders: POST /orders/:id/set-invoice {invoiceId}
```

### Step 6: Download Invoice
```
User -> Invoices: GET /invoices/order/:orderId (get invoice)
User -> Invoices: GET /invoices/:id/pdf (download PDF)
```

---

## Local Development Setup

### Prerequisites
- Node.js 18+
- npm

### Quick Start (All Services)

```bash
# Clone the repo
git clone https://github.com/A-d-1-t-y-a/5-services.git
cd 5-services

# Terminal 1: Products
cd products/backend && npm install && npm run dev

# Terminal 2: Carts
cd carts/backend && npm install && npm run dev

# Terminal 3: Orders
cd orders/backend && npm install && npm run dev

# Terminal 4: Payments
cd payments/backend && npm install && npm run dev

# Terminal 5: Invoices
cd invoices/backend && npm install && npm run dev

# Terminal 6: Gateway
cd gateway && npm install && npm run dev

# Terminal 7: Any frontend (example: Payments)
cd payments/frontend && npm install && npm run dev
```

### Environment Variables

Each service has a `.env` file in its backend directory. Key variables:

```bash
# payments/backend/.env
PORT=4004
ORDERS_SERVICE_URL=http://localhost:4003
CARTS_SERVICE_URL=http://localhost:4002
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# orders/backend/.env
PORT=4003
PRODUCTS_SERVICE_URL=http://localhost:4001
CARTS_SERVICE_URL=http://localhost:4002
PAYMENTS_SERVICE_URL=http://localhost:4004
INVOICES_SERVICE_URL=http://localhost:4005

# carts/backend/.env
PORT=4002
PRODUCTS_SERVICE_URL=http://localhost:4001
PAYMENTS_SERVICE_URL=http://localhost:4004
ORDERS_SERVICE_URL=http://localhost:4003

# invoices/backend/.env
PORT=4005
ORDERS_SERVICE_URL=http://localhost:4003
PRODUCTS_SERVICE_URL=http://localhost:4001
```

### Service Ports

| Service | Backend Port | Frontend Port |
|---------|-------------|---------------|
| Gateway | 4000 | -- |
| Products | 4001 | 3011 |
| Carts | 4002 | 3012 |
| Orders | 4003 | 3013 |
| Payments | 4004 | 3014 |
| Invoices | 4005 | 3015 |

---

## AWS Deployment

### Architecture on AWS

Each service is deployed as a **Lambda function** behind an **API Gateway (HTTP)**. Frontends are hosted on **S3** as static websites. Event processing uses **SQS** with Lambda triggers.

### Lambda Functions

| Function Name | Account | Handler |
|---------------|---------|---------|
| `ecommerce-gateway` | Jaswanth | `dist/lambda.handler` |
| `ecommerce-products` | Jaswanth | `dist/lambda.handler` |
| `ecommerce-carts` | Mounika | `dist/lambda.handler` |
| `ecommerce-orders` | Pavan | `dist/lambda.handler` |
| `ecommerce-payments` | Ruchitha | `dist/lambda.handler` |
| `ecommerce-invoices` | Sriraj | `dist/lambda.handler` |
| `ecommerce-order-processor` | Pavan | `index.handler` |
| `ecommerce-payment-processor` | Ruchitha | `index.handler` |

### Deployment Process

1. Build TypeScript: `npm run build` (compiles to `dist/`)
2. Create zip: `dist/` + `node_modules/`
3. Upload to Lambda: `aws lambda update-function-code --zip-file`
4. Set environment variables: service URLs, Stripe keys, SQS queue URLs
5. Build frontend: `VITE_API_URL=<gateway-url>/api-backend npx vite build`
6. Deploy to S3: `aws s3 sync dist/ s3://<bucket>/`

### Redeployment Script

```bash
# Automated deployment of all services
bash deploy/redeploy-lambda.sh
```

This script handles: credential setup, TypeScript builds, Lambda packaging, API Gateway creation, SQS queues, environment variables, frontend builds, S3 deployment, and health checks.

---

## Testing

### Automated Test Suite

```bash
cd tests
node aws-test.mjs
```

**71 test cases** covering:
- Product CRUD operations
- Cart management (add, remove, discount, clear)
- Order creation and status updates
- Payment validation and processing
- Invoice generation and PDF download
- End-to-end checkout flow
- Inter-service communication
- Error handling and edge cases

### Quick Manual Test (curl)

```bash
GATEWAY="https://d9zh40m2a0.execute-api.us-east-1.amazonaws.com/api-backend"

# 1. List products
curl -s $GATEWAY/products | jq

# 2. Create cart
curl -s -X POST $GATEWAY/cart -H "Content-Type: application/json" -d '{"userId":"demo"}'

# 3. Add item (replace CART_ID)
curl -s -X POST $GATEWAY/cart/CART_ID/items -H "Content-Type: application/json" \
  -d '{"productId":"p1","quantity":2}'

# 4. Checkout (replace CART_ID)
curl -s -X POST $GATEWAY/cart/CART_ID/checkout -H "Content-Type: application/json" \
  -d '{"currency":"USD"}'

# 5. Create Stripe PaymentIntent (replace ORDER_ID)
curl -s -X POST $GATEWAY/payments/create-intent -H "Content-Type: application/json" \
  -d '{"orderId":"ORDER_ID","amount":59.98,"currency":"USD"}'

# 6. Check payment status (replace PAYMENT_ID)
curl -s $GATEWAY/payments/status/PAYMENT_ID
```

---

## Project Structure

```
api/
+-- gateway/                    # API Gateway (routes frontend requests)
|   +-- src/
|   |   +-- server.ts          # Express proxy server
|   |   +-- lambda.ts          # AWS Lambda handler
|   +-- package.json
|
+-- products/                   # Product Catalog Service (Jaswanth)
|   +-- backend/
|   |   +-- src/
|   |   |   +-- routes.ts     # 10 endpoints
|   |   |   +-- service.ts    # Carts/Orders/Frankfurter calls
|   |   |   +-- store.ts      # In-memory product store + seed data
|   |   |   +-- types.ts      # Product interface
|   |   |   +-- validation.ts # Zod schemas
|   |   |   +-- env.ts        # Environment config
|   |   |   +-- httpClient.ts # HTTP utilities
|   |   |   +-- server.ts     # Express app
|   |   |   +-- lambda.ts     # Lambda handler
|   |   +-- package.json
|   +-- frontend/
|       +-- src/App.tsx        # Product management UI
|
+-- carts/                      # Shopping Cart Service (Mounika)
|   +-- backend/
|   |   +-- src/
|   |   |   +-- routes.ts     # 10 endpoints incl. checkout
|   |   |   +-- service.ts    # Products/Orders/Payments calls
|   |   |   +-- store.ts      # Cart store + discount logic
|   |   |   +-- types.ts      # Cart, CartItem interfaces
|   |   |   +-- validation.ts # Zod schemas
|   |   +-- package.json
|   +-- frontend/
|       +-- src/App.tsx        # Cart management + checkout UI
|
+-- orders/                     # Order Processing Service (Pavan)
|   +-- backend/
|   |   +-- src/
|   |   |   +-- routes.ts     # 7 endpoints
|   |   |   +-- service.ts    # Products/Carts/Payments/Email calls
|   |   |   +-- store.ts      # Order store
|   |   |   +-- sqsClient.ts  # SQS order event publisher
|   |   |   +-- types.ts      # Order, OrderStatus types
|   |   |   +-- validation.ts # Zod schemas
|   |   +-- package.json
|   +-- frontend/
|       +-- src/App.tsx        # Order management UI
|
+-- payments/                   # Payment Service (Ruchitha)
|   +-- backend/
|   |   +-- src/
|   |   |   +-- routes.ts     # 8 endpoints (Stripe + legacy)
|   |   |   +-- stripeClient.ts # Stripe SDK initialization
|   |   |   +-- service.ts    # Orders confirmation + validation
|   |   |   +-- cartClient.ts # Cart summary fetcher
|   |   |   +-- store.ts      # Payment store
|   |   |   +-- sqsClient.ts  # SQS payment event publisher
|   |   |   +-- types.ts      # Payment, PaymentStatus types
|   |   |   +-- validation.ts # Zod schemas (incl. Stripe schemas)
|   |   +-- package.json       # includes stripe dependency
|   +-- frontend/
|       +-- src/App.tsx        # Stripe Elements checkout UI
|       +-- package.json       # includes @stripe/stripe-js, @stripe/react-stripe-js
|
+-- invoices/                   # Invoice Service (Sriraj)
|   +-- backend/
|   |   +-- src/
|   |   |   +-- routes.ts     # 5 endpoints
|   |   |   +-- pdf.ts        # PDFKit invoice generator
|   |   |   +-- service.ts    # Orders/Products calls
|   |   |   +-- store.ts      # Invoice store
|   |   |   +-- types.ts      # Invoice, InvoiceItem types
|   |   +-- package.json       # includes pdfkit dependency
|   +-- frontend/
|       +-- src/App.tsx        # Invoice lookup + PDF download UI
|
+-- deploy/                     # Deployment infrastructure
|   +-- lambda-packages/       # Pre-built Lambda zip files
|   +-- lambda-consumers/      # SQS event processor Lambdas
|   |   +-- order-processor/   # Auto-payment on order creation
|   |   +-- payment-processor/ # Auto-invoice on payment completion
|   +-- redeploy-lambda.sh    # Full Lambda deployment script
|   +-- redeploy.sh           # EC2 deployment script (alternative)
|
+-- tests/
|   +-- aws-test.mjs          # 71 automated test cases
|
+-- README.md                   # This file
+-- DEMO-GUIDE.md              # Presentation guide
+-- ASSIGNMENT_STATUS.md       # Grading criteria assessment
+-- DEPLOY.md                  # Deployment documentation
+-- .gitignore
```

---

## Discount Codes (for Demo)

| Code | Discount |
|------|----------|
| `SAVE10` | 10% off cart total |
| `SAVE20` | 20% off cart total |

## Seed Products (auto-loaded)

| ID | Name | Price | Stock |
|----|------|-------|-------|
| `p1` | Wireless Mouse | $29.99 | 100 |
| `p2` | USB-C Hub | $49.99 | 50 |
