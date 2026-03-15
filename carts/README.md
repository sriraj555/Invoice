# Carts – Shopping Cart Management

One folder: **backend** (API) + **frontend** (UI).

- **backend**: Create cart, add/remove items, apply discounts, get summary. Port 4002. Calls Products API for product details.
- **frontend**: Manage cart, add items (product ID + qty), apply SAVE10/SAVE20, view total. Port 3012.

## Run

```bash
cd carts/backend && npm install && npm run build && npm start
cd carts/frontend && npm install && npm run dev
```
