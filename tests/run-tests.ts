/**
 * Comprehensive E2E + Integration Test Suite
 * Tests all 6 microservices: Gateway, Products, Carts, Orders, Payments, Invoices
 *
 * Prerequisites: All services must be running on their default ports
 *   Products: 4001, Carts: 4002, Orders: 4003, Payments: 4004, Invoices: 4005, Gateway: 4000
 *
 * Run: npx ts-node tests/run-tests.ts
 */

const GATEWAY = "http://localhost:4000";
const PRODUCTS = "http://localhost:4001";
const CARTS = "http://localhost:4002";
const ORDERS = "http://localhost:4003";
const PAYMENTS = "http://localhost:4004";
const INVOICES = "http://localhost:4005";

let passed = 0;
let failed = 0;
const failures: string[] = [];

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (err: any) {
    failed++;
    const msg = err?.message ?? String(err);
    failures.push(`${name}: ${msg}`);
    console.log(`  FAIL  ${name} — ${msg}`);
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function assertEqual(actual: any, expected: any, label = ""): void {
  if (actual !== expected) {
    throw new Error(`${label} expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

async function json(url: string, opts?: RequestInit): Promise<any> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const text = await res.text();
  try {
    return { status: res.status, body: JSON.parse(text), headers: res.headers };
  } catch {
    return { status: res.status, body: text, headers: res.headers };
  }
}

async function post(url: string, data: any): Promise<any> {
  return json(url, { method: "POST", body: JSON.stringify(data) });
}

async function put(url: string, data: any): Promise<any> {
  return json(url, { method: "PUT", body: JSON.stringify(data) });
}

async function del(url: string): Promise<any> {
  return json(url, { method: "DELETE" });
}

// ============================================================
// 1. GATEWAY TESTS
// ============================================================
async function gatewayTests() {
  console.log("\n--- GATEWAY TESTS ---");

  await test("Gateway health check returns ok", async () => {
    const { status, body } = await json(`${GATEWAY}/health`);
    assertEqual(status, 200, "status");
    assertEqual(body.status, "ok");
    assertEqual(body.service, "gateway");
  });

  await test("Gateway proxies products via /api-backend/products", async () => {
    const { status, body } = await json(`${GATEWAY}/api-backend/products`);
    assertEqual(status, 200, "status");
    assert(Array.isArray(body), "body should be array");
  });

  await test("Gateway proxies cart creation via /api-backend/cart", async () => {
    const { status, body } = await post(`${GATEWAY}/api-backend/cart`, { userId: "gw-test" });
    assertEqual(status, 201, "status");
    assert(typeof body.id === "string", "should have cart id");
  });

  await test("Gateway returns 404 for unknown api-backend path", async () => {
    const { status } = await json(`${GATEWAY}/api-backend/unknown`);
    assertEqual(status, 404, "status");
  });

  await test("Gateway returns 404 for non-api paths", async () => {
    const { status } = await json(`${GATEWAY}/something`);
    assertEqual(status, 404, "status");
  });
}

// ============================================================
// 2. PRODUCTS SERVICE TESTS
// ============================================================
async function productsTests() {
  console.log("\n--- PRODUCTS SERVICE TESTS ---");

  await test("Products health check", async () => {
    const { status, body } = await json(`${PRODUCTS}/health`);
    assertEqual(status, 200);
    assertEqual(body.service, "products");
  });

  await test("GET /products returns array with seed data", async () => {
    const { status, body } = await json(`${PRODUCTS}/products`);
    assertEqual(status, 200);
    assert(Array.isArray(body), "should be array");
    assert(body.length >= 2, "should have at least 2 seed products");
  });

  await test("GET /products/:id returns product", async () => {
    const { status, body } = await json(`${PRODUCTS}/products/p1`);
    assertEqual(status, 200);
    assertEqual(body.id, "p1");
    assertEqual(body.name, "Wireless Mouse");
  });

  await test("GET /products/:id returns 404 for missing product", async () => {
    const { status } = await json(`${PRODUCTS}/products/nonexistent`);
    assertEqual(status, 404);
  });

  let createdProductId = "";
  await test("POST /products creates a new product", async () => {
    const { status, body } = await post(`${PRODUCTS}/products`, {
      name: "Test Keyboard",
      price: 79.99,
      stock: 25,
      description: "Mechanical keyboard",
      currency: "USD",
      sku: "KB-TEST",
    });
    assertEqual(status, 201);
    assert(typeof body.id === "string", "should have id");
    assertEqual(body.name, "Test Keyboard");
    assertEqual(body.price, 79.99);
    createdProductId = body.id;
  });

  await test("POST /products validates required fields", async () => {
    const { status } = await post(`${PRODUCTS}/products`, { name: "No price" });
    assertEqual(status, 400);
  });

  await test("POST /products rejects negative price", async () => {
    const { status } = await post(`${PRODUCTS}/products`, {
      name: "Bad", price: -10, stock: 1,
    });
    assertEqual(status, 400);
  });

  await test("PUT /products/:id updates product", async () => {
    const { status, body } = await put(`${PRODUCTS}/products/${createdProductId}`, {
      price: 89.99,
    });
    assertEqual(status, 200);
    assertEqual(body.price, 89.99);
  });

  await test("PUT /products/:id returns 404 for missing product without required fields", async () => {
    const { status } = await put(`${PRODUCTS}/products/missing-id`, { price: 10 });
    assertEqual(status, 404);
  });

  await test("POST /products/inventory/check returns availability", async () => {
    const { status, body } = await post(`${PRODUCTS}/products/inventory/check`, {
      productId: "p1",
      quantity: 5,
    });
    assertEqual(status, 200);
    assertEqual(body.available, true);
  });

  await test("POST /products/inventory/check returns false for excess quantity", async () => {
    const { status, body } = await post(`${PRODUCTS}/products/inventory/check`, {
      productId: "p2",
      quantity: 99999,
    });
    assertEqual(status, 200);
    assertEqual(body.available, false);
  });

  await test("POST /products/inventory/check validates input", async () => {
    const { status } = await post(`${PRODUCTS}/products/inventory/check`, {});
    assertEqual(status, 400);
  });

  await test("POST /products/:id/decrease-stock decreases stock", async () => {
    const before = (await json(`${PRODUCTS}/products/p2`)).body;
    const { status, body } = await post(`${PRODUCTS}/products/p2/decrease-stock`, { quantity: 1 });
    assertEqual(status, 200);
    assertEqual(body.newStock, before.stock - 1);
  });

  await test("POST /products/:id/decrease-stock rejects insufficient stock", async () => {
    const { status } = await post(`${PRODUCTS}/products/p2/decrease-stock`, { quantity: 999999 });
    assertEqual(status, 400);
  });

  await test("POST /products/:id/decrease-stock requires positive quantity", async () => {
    const { status } = await post(`${PRODUCTS}/products/p2/decrease-stock`, { quantity: 0 });
    assertEqual(status, 400);
  });

  await test("POST /products/:id/release-stock increases stock", async () => {
    const before = (await json(`${PRODUCTS}/products/p2`)).body;
    const { status, body } = await post(`${PRODUCTS}/products/p2/release-stock`, { quantity: 5 });
    assertEqual(status, 200);
    assertEqual(body.newStock, before.stock + 5);
  });

  await test("GET /recommendations returns recommendations", async () => {
    const { status, body } = await json(`${PRODUCTS}/recommendations`);
    assertEqual(status, 200);
    assert(Array.isArray(body), "should be array");
    assert(body.length > 0, "should have recommendations");
    assert(typeof body[0].score === "number", "should have score");
  });

  await test("POST /products/validate-price validates price", async () => {
    const { status, body } = await post(`${PRODUCTS}/products/validate-price`, {
      amount: 29.99,
      currency: "USD",
    });
    assertEqual(status, 200);
    assertEqual(body.valid, true);
  });

  await test("POST /products/validate-price rejects negative amount", async () => {
    const { status, body } = await post(`${PRODUCTS}/products/validate-price`, {
      amount: -5,
      currency: "USD",
    });
    assertEqual(status, 400);
    assertEqual(body.valid, false);
  });

  await test("DELETE /products/:id deletes product", async () => {
    const { status } = await del(`${PRODUCTS}/products/${createdProductId}`);
    assertEqual(status, 204);
    const { status: s2 } = await json(`${PRODUCTS}/products/${createdProductId}`);
    assertEqual(s2, 404);
  });

  await test("DELETE /products/:id returns 404 for missing product", async () => {
    const { status } = await del(`${PRODUCTS}/products/nonexistent`);
    assertEqual(status, 404);
  });
}

// ============================================================
// 3. CARTS SERVICE TESTS
// ============================================================
async function cartsTests() {
  console.log("\n--- CARTS SERVICE TESTS ---");

  await test("Carts health check", async () => {
    const { status, body } = await json(`${CARTS}/health`);
    assertEqual(status, 200);
    assertEqual(body.service, "carts");
  });

  let cartId = "";
  await test("POST /cart creates a new cart", async () => {
    const { status, body } = await post(`${CARTS}/cart`, { userId: "test-user-1" });
    assertEqual(status, 201);
    assert(typeof body.id === "string", "should have id");
    assertEqual(body.userId, "test-user-1");
    assert(Array.isArray(body.items), "should have items array");
    cartId = body.id;
  });

  await test("POST /cart with no userId defaults to anonymous", async () => {
    const { status, body } = await post(`${CARTS}/cart`, {});
    assertEqual(status, 201);
    assertEqual(body.userId, "anonymous");
  });

  await test("GET /cart/:cartId returns cart", async () => {
    const { status, body } = await json(`${CARTS}/cart/${cartId}`);
    assertEqual(status, 200);
    assertEqual(body.id, cartId);
    assert(typeof body.subtotal === "number", "should have subtotal");
    assert(typeof body.total === "number", "should have total");
  });

  await test("GET /cart/:cartId returns 404 for missing cart", async () => {
    const { status } = await json(`${CARTS}/cart/nonexistent`);
    assertEqual(status, 404);
  });

  await test("POST /cart/:cartId/items adds item to cart", async () => {
    const { status, body } = await post(`${CARTS}/cart/${cartId}/items`, {
      productId: "p1",
      quantity: 3,
    });
    assertEqual(status, 200);
    assert(body.items.length === 1, "should have 1 item");
    assertEqual(body.items[0].productId, "p1");
    assertEqual(body.items[0].quantity, 3);
  });

  await test("POST /cart/:cartId/items merges duplicate products", async () => {
    const { status, body } = await post(`${CARTS}/cart/${cartId}/items`, {
      productId: "p1",
      quantity: 2,
    });
    assertEqual(status, 200);
    assertEqual(body.items.length, 1);
    assertEqual(body.items[0].quantity, 5);
  });

  await test("POST /cart/:cartId/items validates input", async () => {
    const { status } = await post(`${CARTS}/cart/${cartId}/items`, {});
    assertEqual(status, 400);
  });

  await test("POST /cart/:cartId/items rejects unknown product", async () => {
    const { status } = await post(`${CARTS}/cart/${cartId}/items`, {
      productId: "nonexistent",
      quantity: 1,
    });
    assertEqual(status, 404);
  });

  await test("GET /cart/summary/:cartId returns calculated summary", async () => {
    const { status, body } = await json(`${CARTS}/cart/summary/${cartId}`);
    assertEqual(status, 200);
    assert(body.itemCount > 0, "should have items");
    assert(body.subtotal > 0, "should have subtotal");
    assertEqual(body.total, body.subtotal);
  });

  await test("PUT /cart/:cartId/items/:productId updates quantity", async () => {
    const { status, body } = await put(`${CARTS}/cart/${cartId}/items/p1`, { quantity: 1 });
    assertEqual(status, 200);
    assertEqual(body.items[0].quantity, 1);
  });

  await test("PUT /cart/:cartId/items/:productId with 0 removes item", async () => {
    // Add p2 first
    await post(`${CARTS}/cart/${cartId}/items`, { productId: "p2", quantity: 1 });
    const { status, body } = await put(`${CARTS}/cart/${cartId}/items/p2`, { quantity: 0 });
    assertEqual(status, 200);
    assertEqual(body.removed, true);
  });

  await test("POST /cart/:cartId/discount applies SAVE10", async () => {
    const { status, body } = await post(`${CARTS}/cart/${cartId}/discount`, { code: "SAVE10" });
    assertEqual(status, 200);
    assertEqual(body.discountPercent, 10);
  });

  await test("POST /cart/:cartId/discount applies SAVE20", async () => {
    const { status, body } = await post(`${CARTS}/cart/${cartId}/discount`, { code: "save20" });
    assertEqual(status, 200);
    assertEqual(body.discountPercent, 20);
  });

  await test("POST /cart/:cartId/discount rejects invalid code", async () => {
    const { status } = await post(`${CARTS}/cart/${cartId}/discount`, { code: "INVALID" });
    assertEqual(status, 400);
  });

  await test("DELETE /cart/:cartId/items/:productId removes item", async () => {
    const { status, body } = await del(`${CARTS}/cart/${cartId}/items/p1`);
    assertEqual(status, 200);
    assert(body.items.length === 0, "should have no items after removal");
  });

  await test("POST /cart/:cartId/clear clears the cart", async () => {
    await post(`${CARTS}/cart/${cartId}/items`, { productId: "p1", quantity: 1 });
    const { status, body } = await post(`${CARTS}/cart/${cartId}/clear`, {});
    assertEqual(status, 200);
    assertEqual(body.message, "Cart cleared");
  });
}

// ============================================================
// 4. ORDERS SERVICE TESTS
// ============================================================
async function ordersTests() {
  console.log("\n--- ORDERS SERVICE TESTS ---");

  await test("Orders health check", async () => {
    const { status, body } = await json(`${ORDERS}/health`);
    assertEqual(status, 200);
    assertEqual(body.service, "orders");
  });

  let orderId = "";
  await test("POST /orders creates an order", async () => {
    const { status, body } = await post(`${ORDERS}/orders`, {
      userId: "order-test",
      cartId: "cart-123",
      items: [{ productId: "p1", quantity: 1, price: 29.99, name: "Wireless Mouse" }],
      totalAmount: 29.99,
      currency: "USD",
    });
    assertEqual(status, 201);
    assert(typeof body.id === "string", "should have id");
    assertEqual(body.status, "payment_pending");
    orderId = body.id;
  });

  await test("POST /orders validates required fields", async () => {
    const { status } = await post(`${ORDERS}/orders`, { userId: "bad" });
    assertEqual(status, 400);
  });

  await test("GET /orders returns all orders", async () => {
    const { status, body } = await json(`${ORDERS}/orders`);
    assertEqual(status, 200);
    assert(Array.isArray(body), "should be array");
    assert(body.length > 0, "should have orders");
  });

  await test("GET /orders?userId= filters by user", async () => {
    const { status, body } = await json(`${ORDERS}/orders?userId=order-test`);
    assertEqual(status, 200);
    assert(body.every((o: any) => o.userId === "order-test"), "all orders should belong to user");
  });

  await test("GET /orders/:orderId returns order", async () => {
    const { status, body } = await json(`${ORDERS}/orders/${orderId}`);
    assertEqual(status, 200);
    assertEqual(body.id, orderId);
  });

  await test("GET /orders/:orderId returns 404 for missing order", async () => {
    const { status } = await json(`${ORDERS}/orders/nonexistent`);
    assertEqual(status, 404);
  });

  await test("PUT /orders/:orderId updates status", async () => {
    const { status, body } = await put(`${ORDERS}/orders/${orderId}`, { status: "processing" });
    assertEqual(status, 200);
    assertEqual(body.status, "processing");
  });

  await test("PUT /orders/:orderId validates status value", async () => {
    const { status } = await put(`${ORDERS}/orders/${orderId}`, { status: "invalid_status" });
    assertEqual(status, 400);
  });

  await test("POST /orders/:orderId/confirm-payment requires paymentId", async () => {
    const { status } = await post(`${ORDERS}/orders/${orderId}/confirm-payment`, {});
    assertEqual(status, 400);
  });

  await test("POST /orders/:orderId/confirm-payment works with paymentId", async () => {
    // Create a fresh order for payment confirmation
    const orderRes = await post(`${ORDERS}/orders`, {
      userId: "pay-test",
      cartId: "cart-pay",
      items: [{ productId: "p1", quantity: 1, price: 29.99, name: "Wireless Mouse" }],
      totalAmount: 29.99,
      currency: "USD",
    });
    const { status, body } = await post(
      `${ORDERS}/orders/${orderRes.body.id}/confirm-payment`,
      { paymentId: "pay-123" }
    );
    assertEqual(status, 200);
    assertEqual(body.status, "paid");
    assertEqual(body.paymentId, "pay-123");
  });
}

// ============================================================
// 5. PAYMENTS SERVICE TESTS
// ============================================================
async function paymentsTests() {
  console.log("\n--- PAYMENTS SERVICE TESTS ---");

  await test("Payments health check", async () => {
    const { status, body } = await json(`${PAYMENTS}/health`);
    assertEqual(status, 200);
    assertEqual(body.service, "payments");
  });

  await test("POST /payments/validate validates payment details", async () => {
    const { status, body } = await post(`${PAYMENTS}/payments/validate`, {
      orderId: "ord-1",
      amount: 29.99,
      currency: "USD",
    });
    assertEqual(status, 200);
    assertEqual(body.valid, true);
  });

  await test("POST /payments/validate rejects missing fields", async () => {
    const { status } = await post(`${PAYMENTS}/payments/validate`, {});
    assertEqual(status, 400);
  });

  await test("POST /payments/validate rejects zero amount", async () => {
    const { status } = await post(`${PAYMENTS}/payments/validate`, {
      orderId: "ord-1",
      amount: 0,
      currency: "USD",
    });
    assertEqual(status, 400);
  });

  let paymentId = "";
  await test("POST /payments processes payment", async () => {
    // First create an order so confirmation can work
    const orderRes = await post(`${ORDERS}/orders`, {
      userId: "payment-test",
      cartId: "cart-pt",
      items: [{ productId: "p1", quantity: 1, price: 29.99, name: "Wireless Mouse" }],
      totalAmount: 29.99,
      currency: "USD",
    });
    const { status, body } = await post(`${PAYMENTS}/payments`, {
      orderId: orderRes.body.id,
      amount: 29.99,
      currency: "USD",
    });
    assertEqual(status, 201);
    assert(typeof body.id === "string", "should have payment id");
    assertEqual(body.status, "succeeded");
    paymentId = body.id;
  });

  await test("GET /payments/:paymentId returns payment", async () => {
    const { status, body } = await json(`${PAYMENTS}/payments/${paymentId}`);
    assertEqual(status, 200);
    assertEqual(body.id, paymentId);
  });

  await test("GET /payments/:paymentId returns 404 for missing payment", async () => {
    const { status } = await json(`${PAYMENTS}/payments/nonexistent`);
    assertEqual(status, 404);
  });

  await test("GET /payments/status/:paymentId returns status", async () => {
    const { status, body } = await json(`${PAYMENTS}/payments/status/${paymentId}`);
    assertEqual(status, 200);
    assertEqual(body.status, "succeeded");
    assertEqual(body.paymentId, paymentId);
  });

  await test("POST /payments/confirm confirms payment", async () => {
    const payment = (await json(`${PAYMENTS}/payments/${paymentId}`)).body;
    const { status, body } = await post(`${PAYMENTS}/payments/confirm`, {
      orderId: payment.orderId,
      paymentId: paymentId,
    });
    assertEqual(status, 200);
    assertEqual(body.success, true);
  });

  await test("POST /payments/confirm rejects mismatched order", async () => {
    const { status, body } = await post(`${PAYMENTS}/payments/confirm`, {
      orderId: "wrong-order",
      paymentId: paymentId,
    });
    assertEqual(status, 404);
    assertEqual(body.success, false);
  });
}

// ============================================================
// 6. INVOICES SERVICE TESTS
// ============================================================
async function invoicesTests() {
  console.log("\n--- INVOICES SERVICE TESTS ---");

  await test("Invoices health check", async () => {
    const { status, body } = await json(`${INVOICES}/health`);
    assertEqual(status, 200);
    assertEqual(body.service, "invoices");
  });

  // Create an order first to generate invoice from
  let orderId = "";
  let invoiceId = "";
  await test("Setup: create order for invoice tests", async () => {
    const { body } = await post(`${ORDERS}/orders`, {
      userId: "inv-test",
      cartId: "cart-inv",
      items: [{ productId: "p1", quantity: 2, price: 29.99, name: "Wireless Mouse" }],
      totalAmount: 59.98,
      currency: "USD",
    });
    orderId = body.id;
    assert(!!orderId, "should have order id");
  });

  await test("POST /invoices creates invoice from order", async () => {
    const { status, body } = await post(`${INVOICES}/invoices`, { orderId });
    assertEqual(status, 201);
    assert(typeof body.id === "string", "should have invoice id");
    assertEqual(body.orderId, orderId);
    assertEqual(body.amount, 59.98);
    invoiceId = body.id;
  });

  await test("POST /invoices returns existing invoice for same order (idempotent)", async () => {
    const { status, body } = await post(`${INVOICES}/invoices`, { orderId });
    assertEqual(status, 201);
    assertEqual(body.id, invoiceId);
  });

  await test("POST /invoices validates orderId", async () => {
    const { status } = await post(`${INVOICES}/invoices`, {});
    assertEqual(status, 400);
  });

  await test("POST /invoices returns 404 for nonexistent order", async () => {
    const { status } = await post(`${INVOICES}/invoices`, { orderId: "fake-order" });
    assertEqual(status, 404);
  });

  await test("GET /invoices/:invoiceId returns invoice", async () => {
    const { status, body } = await json(`${INVOICES}/invoices/${invoiceId}`);
    assertEqual(status, 200);
    assertEqual(body.id, invoiceId);
    assert(Array.isArray(body.items), "should have items");
  });

  await test("GET /invoices/:invoiceId returns 404 for missing", async () => {
    const { status } = await json(`${INVOICES}/invoices/nonexistent`);
    assertEqual(status, 404);
  });

  await test("GET /invoices/order/:orderId returns invoice by order", async () => {
    const { status, body } = await json(`${INVOICES}/invoices/order/${orderId}`);
    assertEqual(status, 200);
    assertEqual(body.orderId, orderId);
  });

  await test("GET /invoices/order/:orderId returns 404 for missing order", async () => {
    const { status } = await json(`${INVOICES}/invoices/order/nonexistent`);
    assertEqual(status, 404);
  });

  await test("GET /invoices/:invoiceId/pdf returns PDF", async () => {
    const res = await fetch(`${INVOICES}/invoices/${invoiceId}/pdf`);
    assertEqual(res.status, 200);
    const ct = res.headers.get("Content-Type") ?? "";
    assert(ct.includes("application/pdf"), `Content-Type should be PDF, got: ${ct}`);
    const buffer = await res.arrayBuffer();
    assert(buffer.byteLength > 100, "PDF should have content");
  });

  await test("GET /test-pdf returns test PDF", async () => {
    const res = await fetch(`${INVOICES}/test-pdf`);
    assertEqual(res.status, 200);
    const ct = res.headers.get("Content-Type") ?? "";
    assert(ct.includes("application/pdf"), "should be PDF");
  });
}

// ============================================================
// 7. FULL E2E FLOW TESTS
// ============================================================
async function e2eFlowTests() {
  console.log("\n--- END-TO-END FLOW TESTS ---");

  await test("Full flow: browse -> cart -> order -> pay -> invoice", async () => {
    // 1. Browse products
    const products = (await json(`${PRODUCTS}/products`)).body;
    assert(products.length > 0, "should have products");
    const product = products[0];

    // 2. Create cart and add item
    const cart = (await post(`${CARTS}/cart`, { userId: "e2e-flow" })).body;
    const cartWithItems = (
      await post(`${CARTS}/cart/${cart.id}/items`, {
        productId: product.id,
        quantity: 1,
      })
    ).body;
    assert(cartWithItems.items.length === 1, "cart should have 1 item");

    // 3. Get cart summary
    const summary = (await json(`${CARTS}/cart/summary/${cart.id}`)).body;
    assert(summary.total > 0, "total should be positive");

    // 4. Create order
    const order = (
      await post(`${ORDERS}/orders`, {
        userId: "e2e-flow",
        cartId: cart.id,
        items: cartWithItems.items.map((i: any) => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price,
          name: i.name,
        })),
        totalAmount: summary.total,
        currency: "USD",
      })
    ).body;
    assertEqual(order.status, "payment_pending");

    // 5. Validate payment
    const validation = (
      await post(`${PAYMENTS}/payments/validate`, {
        orderId: order.id,
        amount: summary.total,
        currency: "USD",
      })
    ).body;
    assertEqual(validation.valid, true);

    // 6. Process payment
    const payment = (
      await post(`${PAYMENTS}/payments`, {
        orderId: order.id,
        amount: summary.total,
        currency: "USD",
      })
    ).body;
    assertEqual(payment.status, "succeeded");

    // 7. Verify invoice was created
    const invoice = (await json(`${INVOICES}/invoices/order/${order.id}`)).body;
    assert(typeof invoice.id === "string", "should have invoice");
    assertEqual(invoice.orderId, order.id);

    // 8. Download invoice PDF
    const pdfRes = await fetch(`${INVOICES}/invoices/${invoice.id}/pdf`);
    assertEqual(pdfRes.status, 200);
    assert(
      (pdfRes.headers.get("Content-Type") ?? "").includes("application/pdf"),
      "should be PDF"
    );
  });

  await test("Full flow via Gateway: browse -> cart -> order -> pay", async () => {
    const GW = `${GATEWAY}/api-backend`;

    // Browse
    const products = (await json(`${GW}/products`)).body;
    const product = products[0];

    // Cart
    const cart = (await post(`${GW}/cart`, { userId: "gw-e2e" })).body;
    await post(`${GW}/cart/${cart.id}/items`, {
      productId: product.id,
      quantity: 1,
    });
    const summary = (await json(`${GW}/cart/summary/${cart.id}`)).body;

    // Order
    const order = (
      await post(`${GW}/orders`, {
        userId: "gw-e2e",
        cartId: cart.id,
        items: [{ productId: product.id, quantity: 1, price: product.price, name: product.name }],
        totalAmount: summary.total,
        currency: "USD",
      })
    ).body;
    assertEqual(order.status, "payment_pending");

    // Payment
    const payment = (
      await post(`${GW}/payments`, {
        orderId: order.id,
        amount: summary.total,
        currency: "USD",
      })
    ).body;
    assertEqual(payment.status, "succeeded");
  });

  await test("Stock decreases after payment", async () => {
    const before = (await json(`${PRODUCTS}/products/p1`)).body.stock;
    const cart = (await post(`${CARTS}/cart`, { userId: "stock-test" })).body;
    await post(`${CARTS}/cart/${cart.id}/items`, { productId: "p1", quantity: 1 });
    const order = (
      await post(`${ORDERS}/orders`, {
        userId: "stock-test",
        cartId: cart.id,
        items: [{ productId: "p1", quantity: 1, price: 29.99, name: "Mouse" }],
        totalAmount: 29.99,
        currency: "USD",
      })
    ).body;
    await post(`${PAYMENTS}/payments`, {
      orderId: order.id,
      amount: 29.99,
      currency: "USD",
    });
    const after = (await json(`${PRODUCTS}/products/p1`)).body.stock;
    assertEqual(after, before - 1);
  });

  await test("Discount applies to cart total correctly", async () => {
    const cart = (await post(`${CARTS}/cart`, { userId: "discount-test" })).body;
    await post(`${CARTS}/cart/${cart.id}/items`, { productId: "p1", quantity: 2 });
    await post(`${CARTS}/cart/${cart.id}/discount`, { code: "SAVE10" });
    const summary = (await json(`${CARTS}/cart/summary/${cart.id}`)).body;
    const expectedDiscount = summary.subtotal * 0.10;
    assert(
      Math.abs(summary.discountAmount - expectedDiscount) < 0.01,
      `discount should be 10% of subtotal`
    );
    assert(
      Math.abs(summary.total - (summary.subtotal - expectedDiscount)) < 0.01,
      `total should be subtotal minus discount`
    );
  });
}

// ============================================================
// MAIN RUNNER
// ============================================================
async function main() {
  console.log("=========================================");
  console.log(" E-Commerce Microservices Test Suite");
  console.log("=========================================");

  await gatewayTests();
  await productsTests();
  await cartsTests();
  await ordersTests();
  await paymentsTests();
  await invoicesTests();
  await e2eFlowTests();

  console.log("\n=========================================");
  console.log(` RESULTS: ${passed} passed, ${failed} failed (${passed + failed} total)`);
  console.log("=========================================");

  if (failures.length > 0) {
    console.log("\nFailed tests:");
    failures.forEach((f) => console.log(`  - ${f}`));
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(2);
});
