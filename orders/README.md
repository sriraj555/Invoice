# Orders – Order Processing & Management

One folder: **backend** (API) + **frontend** (UI).

- **backend**: Create order, get/update status, confirm payment; calls Cart, Products, Invoices, Email. Port 4003.
- **frontend**: Track order by ID, list orders, update status. Port 3013.

## Run

```bash
cd orders/backend && npm install && npm run build && npm start
cd orders/frontend && npm install && npm run dev
```
