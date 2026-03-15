# Scripts

## start-all.ps1 (Windows PowerShell)

Starts all backends and frontends in **separate terminal windows**.

**Usage (from repo root):**

```powershell
.\scripts\start-all.ps1
```

**What it does:**

1. **.env** – In each backend and frontend folder, if `.env` is missing, it is created from `.env.example` (or an empty `.env` is created).
2. **npm install** – In each folder, if `node_modules` is missing, runs `npm install`.
3. **Start** – Opens 11 new PowerShell windows and runs:
   - 6 backends: products (4001), carts (4002), orders (4003), payments (4004), invoices (4005), gateway (4000)
   - 5 frontends: products (3011), carts (3012), orders (3013), payments (3014), invoices (3015)

Each window runs `npm run dev` so you see logs. Close a window to stop that service.

**First run:** Ensure you are in the repo root (the folder that contains `products`, `carts`, `gateway`, etc.), then run the script.

## e2e-api-test.mjs

E2E API test. Run after all backends and gateway are up:

```bash
node scripts/e2e-api-test.mjs
# or: npm run test:e2e
```
