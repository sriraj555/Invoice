# Products – Product Catalog & Inventory

One folder: **backend** (API) + **frontend** (UI).

- **backend**: Product catalog, inventory check, recommendations (classmate API), validate price (public API). Port 4001.
- **frontend**: Browse products, check stock, view recommendations, validate price. Port 3011.

## Run

```bash
# From api/
cd products/backend && npm install && npm run build && npm start
cd products/frontend && npm install && npm run dev
```

API base: `http://localhost:4001` (or via gateway `/api-backend`).
