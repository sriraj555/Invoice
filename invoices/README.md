# Invoices -- Invoice & Receipt Generator API

**Owner**: Sriraj Gannavaram (x24331873)
**Port**: 4005 | **Lambda**: `ecommerce-invoices`

## What This Service Does

Generates invoices and downloadable PDF receipts for completed orders. Fetches order details from the Orders service and product SKUs from the Products service, then creates professional A4-format PDF invoices using PDFKit.

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/invoices` | Create invoice from order ID |
| `GET` | `/invoices/order/:orderId` | Get invoice by order ID |
| `GET` | `/invoices/:invoiceId` | Get invoice by invoice ID |
| `GET` | `/invoices/:invoiceId/pdf` | Download invoice as PDF |
| `GET` | `/test-pdf` | Test PDF generation (sample invoice) |

## Invoice Creation Flow

```
POST /invoices {orderId}
  1. Fetch order details -> GET /orders/:orderId
  2. For each item, fetch product SKU -> GET /products/:id
  3. Create invoice record with itemized list
  4. Generate PDF buffer with PDFKit
  5. Return invoice metadata
```

## PDF Generation

Invoices are generated as A4 PDFs using PDFKit, containing:
- Invoice number and date
- Order ID and customer info
- Itemized list: product name, SKU, quantity, unit price, line total
- Subtotal and grand total
- Footer with thank-you message

## Inter-Service Communication

| Target Service | Call | Purpose |
|---------------|------|---------|
| **Orders** (Pavan) | `GET /orders/:orderId` | Fetch order details (items, amounts, customer) |
| **Products** (Jaswanth) | `GET /products/:id` | Fetch product SKU for invoice line items |

## How Invoices Are Triggered

Invoices are automatically created by the **SQS payment-processor Lambda** when a `PAYMENT_COMPLETED` event is received:

```
Payments Service -> SQS (PAYMENT_COMPLETED) -> payment-processor Lambda
  -> POST /invoices {orderId}  (creates invoice)
  -> POST /orders/:id/set-invoice {invoiceId}  (links invoice to order)
```

Users can also manually create invoices via the Invoices frontend.

## Data Model

```typescript
interface Invoice {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    sku?: string;
  }>;
  pdfUrl?: string;
  createdAt: string;
}
```

## Run Locally

```bash
cd invoices/backend && npm install && npm run dev    # Backend on :4005
cd invoices/frontend && npm install && npm run dev   # Frontend on :3015
```

## Environment Variables

```bash
PORT=4005
ORDERS_SERVICE_URL=http://localhost:4003
PRODUCTS_SERVICE_URL=http://localhost:4001
```
