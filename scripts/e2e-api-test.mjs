/**
 * E2E API test: full flow via gateway (products → cart → discount → order → payment).
 * Run: node scripts/e2e-api-test.mjs
 * Requires: gateway + all 5 backends running (ports 4000–4005).
 */

const GATEWAY = "http://localhost:4000/api-backend";

async function request(method, path, body) {
  const url = path.startsWith("http") ? path : `${GATEWAY}${path}`;
  const opt = { method, headers: { "Content-Type": "application/json" } };
  if (body && method !== "GET") opt.body = JSON.stringify(body);
  const res = await fetch(url, opt);
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data;
}

async function main() {
  console.log("E2E API test (gateway:", GATEWAY, ")...\n");

  const products = await request("GET", "/products");
  console.log("✓ GET /products", products.length, "items");

  const recs = await request("GET", "/recommendations");
  console.log("✓ GET /recommendations (classmate API)", recs.length, "items");

  const cart = await request("POST", "/cart", { userId: "e2e-user" });
  const cartId = cart.id;
  console.log("✓ POST /cart", "cartId:", cartId);

  await request("POST", `/cart/${cartId}/items`, { productId: "p1", quantity: 1 });
  await request("POST", `/cart/${cartId}/discount`, { code: "SAVE10" });
  const summary = await request("GET", `/cart/summary/${cartId}`);
  console.log("✓ Cart: add item + discount, total:", summary.total);

  const orderPayload = {
    userId: "e2e-user",
    cartId,
    items: [{ productId: "p1", quantity: 1, price: 10, name: "Product 1" }],
    totalAmount: summary.total,
    currency: "USD",
  };
  const order = await request("POST", "/orders", orderPayload);
  console.log("✓ POST /orders", "orderId:", order.id);

  const payment = await request("POST", "/payments", {
    orderId: order.id,
    amount: summary.total,
    currency: "USD",
    cartId,
  });
  console.log("✓ POST /payments", "status:", payment.status);

  const invoice = await request("GET", `/invoices/order/${order.id}`);
  console.log("✓ GET invoice by order", "invoiceId:", invoice?.id);

  console.log("\nAll steps passed.");
}

main().catch((err) => {
  console.error("FAIL:", err.message);
  process.exit(1);
});
