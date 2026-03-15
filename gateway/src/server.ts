import express, { Request, Response } from "express";
import cors from "cors";

const PRODUCTS_URL = process.env.PRODUCTS_SERVICE_URL ?? "http://localhost:4001";
const CARTS_URL = process.env.CARTS_SERVICE_URL ?? "http://localhost:4002";
const ORDERS_URL = process.env.ORDERS_SERVICE_URL ?? "http://localhost:4003";
const PAYMENTS_URL = process.env.PAYMENTS_SERVICE_URL ?? "http://localhost:4004";
const INVOICES_URL = process.env.INVOICES_SERVICE_URL ?? "http://localhost:4005";

const PORT = parseInt(process.env.PORT ?? "4000", 10);

async function proxy(
  req: Request,
  res: Response,
  baseUrl: string,
  path: string
): Promise<void> {
  const query = req.originalUrl.includes("?") ? "?" + req.originalUrl.split("?")[1] : "";
  const url = `${baseUrl}${path}${query}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const init: RequestInit = {
    method: req.method,
    headers,
  };
  if (req.method !== "GET" && req.method !== "HEAD" && req.body !== undefined) {
    init.body = JSON.stringify(req.body);
  }
  try {
    const response = await fetch(url, init);
    const text = await response.text();
    res.status(response.status).setHeader("Content-Type", response.headers.get("Content-Type") ?? "application/json");
    res.send(text);
  } catch (err) {
    res.status(502).json({ message: "Bad Gateway", error: String(err) });
  }
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) =>
  res.json({ status: "ok", service: "gateway" })
);

app.use((req: Request, res: Response, next: () => void) => {
  if (!req.path.startsWith("/api-backend")) {
    next();
    return;
  }
  const path = req.path.replace(/^\/api-backend/, "") || "/";
  let base = "";
  if (path.startsWith("/products") || path.startsWith("/recommendations")) base = PRODUCTS_URL;
  else if (path.startsWith("/cart")) base = CARTS_URL;
  else if (path.startsWith("/orders")) base = ORDERS_URL;
  else if (path.startsWith("/payments")) base = PAYMENTS_URL;
  else if (path.startsWith("/invoices")) base = INVOICES_URL;
  else {
    res.status(404).json({ message: "Not found" });
    return;
  }
  proxy(req, res, base, path);
});

app.use((_req, res) => res.status(404).json({ message: "Not found" }));

app.listen(PORT, () =>
  console.log(`Gateway http://localhost:${PORT}`)
);
