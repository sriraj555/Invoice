# Payments – Payment Processing & Validation

One folder: **backend** (API) + **frontend** (UI).

- **backend**: Validate payment, process payment, get status. Calls Cart (total), Order (confirm). Port 4004.
- **frontend**: Validate (order ID + amount), process payment, look up status. Port 3014.

## Run

```bash
cd payments/backend && npm install && npm run build && npm start
cd payments/frontend && npm install && npm run dev
```
