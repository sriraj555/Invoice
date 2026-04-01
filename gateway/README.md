# Gateway -- API Gateway / Request Router

**Owner**: Jaswanth Neyigapula (x23420464)
**Port**: 4000 | **Lambda**: `ecommerce-gateway`

## What This Service Does

Central entry point for all frontend requests. Receives requests on `/api-backend/*` and proxies them to the correct backend service based on the URL path. Handles CORS and binary responses (PDFs).

## Routing Table

| Path Prefix | Routed To | Service |
|------------|-----------|---------|
| `/api-backend/products*` | Products Service (4001) | Jaswanth |
| `/api-backend/recommendations` | Products Service (4001) | Jaswanth |
| `/api-backend/cart*` | Carts Service (4002) | Mounika |
| `/api-backend/orders*` | Orders Service (4003) | Pavan |
| `/api-backend/payments*` | Payments Service (4004) | Ruchitha |
| `/api-backend/invoices*` | Invoices Service (4005) | Sriraj |

## How It Works

1. Frontend sends request to `GATEWAY_URL/api-backend/products`
2. Gateway strips `/api-backend` prefix
3. Matches path to target service URL
4. Forwards the full request (method, headers, body)
5. Returns the response to the frontend

Special handling for binary content types (`application/pdf`, `application/octet-stream`) to support PDF invoice downloads.

## Run Locally

```bash
cd gateway && npm install && npm run dev   # Gateway on :4000
```

## Environment Variables

```bash
PORT=4000
PRODUCTS_SERVICE_URL=http://localhost:4001
CARTS_SERVICE_URL=http://localhost:4002
ORDERS_SERVICE_URL=http://localhost:4003
PAYMENTS_SERVICE_URL=http://localhost:4004
INVOICES_SERVICE_URL=http://localhost:4005
```
