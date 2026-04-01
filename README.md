# Invoices – Invoice & Receipt Generator

One folder: **backend** (API) + **frontend** (UI).

- **backend**: Create invoice by order ID, get by order/invoice ID, PDF download. Calls Order, Products (SKU). Port 4005.
- **frontend**: Create invoice, look up by order or invoice ID, download PDF. Port 3015.

## Run

```bash
cd invoices/backend && npm install && npm run build && npm start
cd invoices/frontend && npm install && npm run dev
```
