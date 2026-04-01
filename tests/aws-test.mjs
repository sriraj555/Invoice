// Distributed deployment IPs
const GATEWAY_IP = process.env.GATEWAY_IP || "98.80.69.230";
const PRODUCTS_IP = process.env.PRODUCTS_IP || "98.80.69.230";
const CARTS_IP = process.env.CARTS_IP || "44.210.149.76";
const ORDERS_IP = process.env.ORDERS_IP || "54.237.130.136";
const PAYMENTS_IP = process.env.PAYMENTS_IP || "44.220.46.106";
const INVOICES_IP = process.env.INVOICES_IP || "3.235.180.116";
const IP = GATEWAY_IP; // for gateway tests
const results = [];
const state = {};

async function test(name, fn) {
  try {
    await fn();
    results.push({ name, pass: true });
    console.log("  PASS " + name);
  } catch (e) {
    results.push({ name, pass: false, err: e.message });
    console.log("  FAIL " + name + " — " + e.message);
  }
}

function assert(c, m) { if (!c) throw new Error(m); }

async function json(url, opts) {
  const r = await fetch(url, { headers: { "Content-Type": "application/json" }, ...opts });
  const t = await r.text();
  try { return { status: r.status, data: JSON.parse(t) }; } catch { return { status: r.status, data: t }; }
}

(async () => {
  console.log(`\nTesting against http://${IP}\n`);

  // === GATEWAY (5 tests) ===
  console.log("--- Gateway ---");
  await test("Gateway health", async () => {
    const r = await json(`http://${GATEWAY_IP}:4000/health`);
    assert(r.status === 200 && r.data.status === "ok", "Expected 200 ok");
  });
  await test("Gateway 404", async () => {
    const r = await json(`http://${GATEWAY_IP}:4000/nonexistent`);
    assert(r.status === 404, "Expected 404");
  });
  await test("Gateway proxy to products", async () => {
    const r = await json(`http://${GATEWAY_IP}:4000/api-backend/products`);
    assert(r.status === 200 && Array.isArray(r.data), "Expected array");
  });
  await test("Gateway proxy to orders", async () => {
    const r = await json(`http://${GATEWAY_IP}:4000/api-backend/orders`);
    assert(r.status === 200 && Array.isArray(r.data), "Expected array");
  });
  await test("Gateway proxy unknown path", async () => {
    const r = await json(`http://${GATEWAY_IP}:4000/api-backend/unknown`);
    assert(r.status === 404, "Expected 404");
  });

  // === PRODUCTS (15 tests) ===
  console.log("\n--- Products ---");
  await test("Products health", async () => {
    const r = await json(`http://${PRODUCTS_IP}:4001/health`);
    assert(r.status === 200, "Expected 200");
  });
  await test("List products", async () => {
    const r = await json(`http://${PRODUCTS_IP}:4001/products`);
    assert(r.status === 200 && Array.isArray(r.data) && r.data.length >= 2, "Expected >=2 products");
  });
  await test("Get product p1", async () => {
    const r = await json(`http://${PRODUCTS_IP}:4001/products/p1`);
    assert(r.status === 200 && r.data.name === "Wireless Mouse", "Expected Wireless Mouse");
  });
  await test("Get product p2", async () => {
    const r = await json(`http://${PRODUCTS_IP}:4001/products/p2`);
    assert(r.status === 200 && r.data.name === "USB-C Hub", "Expected USB-C Hub");
  });
  await test("Product 404", async () => {
    const r = await json(`http://${PRODUCTS_IP}:4001/products/nonexistent`);
    assert(r.status === 404, "Expected 404");
  });
  await test("Create product", async () => {
    const r = await json(`http://${PRODUCTS_IP}:4001/products`, {
      method: "POST", body: JSON.stringify({ name: "Test Item", description: "desc", price: 5.99, currency: "USD", stock: 20, sku: "T-001" })
    });
    assert(r.status === 201 && r.data.id, "Expected 201 with id");
    state.testProductId = r.data.id;
  });
  await test("Update product", async () => {
    const r = await json(`http://${PRODUCTS_IP}:4001/products/${state.testProductId}`, {
      method: "PUT", body: JSON.stringify({ price: 7.99 })
    });
    assert(r.status === 200 && r.data.price === 7.99, "Expected updated price");
  });
  await test("Check inventory (POST /products/inventory/check)", async () => {
    const r = await json(`http://${PRODUCTS_IP}:4001/products/inventory/check`, {
      method: "POST", body: JSON.stringify({ productId: "p1", quantity: 1 })
    });
    assert(r.status === 200, "Expected 200");
  });
  await test("Validate price (valid)", async () => {
    const r = await json(`http://${PRODUCTS_IP}:4001/products/validate-price`, {
      method: "POST", body: JSON.stringify({ amount: 29.99, currency: "USD" })
    });
    assert(r.status === 200 && r.data.valid === true, "Expected valid");
  });
  await test("Validate price (invalid)", async () => {
    const r = await json(`http://${PRODUCTS_IP}:4001/products/validate-price`, {
      method: "POST", body: JSON.stringify({ amount: -5, currency: "USD" })
    });
    assert(r.status === 400, "Expected 400");
  });
  await test("Decrease stock", async () => {
    const r = await json(`http://${PRODUCTS_IP}:4001/products/p1/decrease-stock`, {
      method: "POST", body: JSON.stringify({ quantity: 1 })
    });
    assert(r.status === 200, "Expected 200");
  });
  await test("Release stock", async () => {
    const r = await json(`http://${PRODUCTS_IP}:4001/products/p1/release-stock`, {
      method: "POST", body: JSON.stringify({ quantity: 1 })
    });
    assert(r.status === 200, "Expected 200");
  });
  await test("Recommendations", async () => {
    const r = await json(`http://${PRODUCTS_IP}:4001/recommendations`);
    assert(r.status === 200 && Array.isArray(r.data), "Expected array");
  });
  await test("Delete product", async () => {
    const r = await json(`http://${PRODUCTS_IP}:4001/products/${state.testProductId}`, { method: "DELETE" });
    assert(r.status === 200 || r.status === 204, "Expected 200/204");
  });
  await test("Verify deleted", async () => {
    const r = await json(`http://${PRODUCTS_IP}:4001/products/${state.testProductId}`);
    assert(r.status === 404, "Expected 404");
  });
  await test("Create product with invalid price", async () => {
    const r = await json(`http://${PRODUCTS_IP}:4001/products`, {
      method: "POST", body: JSON.stringify({ name: "Bad", description: "d", price: -5, currency: "USD", stock: 1, sku: "B-1" })
    });
    assert(r.status === 400, "Expected 400");
  });

  // === CARTS (12 tests) ===
  console.log("\n--- Carts ---");
  await test("Carts health", async () => {
    const r = await json(`http://${CARTS_IP}:4002/health`);
    assert(r.status === 200, "Expected 200");
  });
  await test("Create cart", async () => {
    const r = await json(`http://${CARTS_IP}:4002/cart`, {
      method: "POST", body: JSON.stringify({ userId: "tester" })
    });
    assert(r.status === 201 && r.data.id, "Expected 201");
    state.cartId = r.data.id;
  });
  await test("Get cart", async () => {
    const r = await json(`http://${CARTS_IP}:4002/cart/${state.cartId}`);
    assert(r.status === 200 && r.data.userId === "tester", "Expected tester");
  });
  await test("Cart 404", async () => {
    const r = await json(`http://${CARTS_IP}:4002/cart/nonexistent`);
    assert(r.status === 404, "Expected 404");
  });
  await test("Add item to cart", async () => {
    const r = await json(`http://${CARTS_IP}:4002/cart/${state.cartId}/items`, {
      method: "POST", body: JSON.stringify({ productId: "p1", quantity: 2 })
    });
    assert(r.status === 200 && r.data.items.length === 1, "Expected 1 item");
  });
  await test("Add second item", async () => {
    const r = await json(`http://${CARTS_IP}:4002/cart/${state.cartId}/items`, {
      method: "POST", body: JSON.stringify({ productId: "p2", quantity: 1 })
    });
    assert(r.status === 200 && r.data.items.length === 2, "Expected 2 items");
  });
  await test("Update item quantity", async () => {
    const r = await json(`http://${CARTS_IP}:4002/cart/${state.cartId}/items/p1`, {
      method: "PUT", body: JSON.stringify({ quantity: 5 })
    });
    assert(r.status === 200, "Expected 200");
  });
  await test("Apply discount SAVE10", async () => {
    const r = await json(`http://${CARTS_IP}:4002/cart/${state.cartId}/discount`, {
      method: "POST", body: JSON.stringify({ code: "SAVE10" })
    });
    assert(r.status === 200, "Expected 200");
  });
  await test("Get cart with totals", async () => {
    const r = await json(`http://${CARTS_IP}:4002/cart/${state.cartId}`);
    assert(r.status === 200 && r.data.total > 0 && r.data.discountAmount > 0, "Expected totals");
  });
  await test("Cart summary", async () => {
    const r = await json(`http://${CARTS_IP}:4002/cart/summary/${state.cartId}`);
    assert(r.status === 200, "Expected 200");
  });
  await test("Remove item from cart", async () => {
    const r = await json(`http://${CARTS_IP}:4002/cart/${state.cartId}/items/p2`, { method: "DELETE" });
    assert(r.status === 200, "Expected 200");
  });
  await test("Clear cart", async () => {
    const r = await json(`http://${CARTS_IP}:4002/cart/${state.cartId}/clear`, { method: "POST" });
    assert(r.status === 200, "Expected 200");
  });

  // === ORDERS (10 tests) ===
  console.log("\n--- Orders ---");
  const cartR = await json(`http://${CARTS_IP}:4002/cart`, { method: "POST", body: JSON.stringify({ userId: "order-tester" }) });
  state.orderCartId = cartR.data.id;
  await json(`http://${CARTS_IP}:4002/cart/${state.orderCartId}/items`, { method: "POST", body: JSON.stringify({ productId: "p1", quantity: 2 }) });

  await test("Orders health", async () => {
    const r = await json(`http://${ORDERS_IP}:4003/health`);
    assert(r.status === 200, "Expected 200");
  });
  await test("Create order", async () => {
    const r = await json(`http://${ORDERS_IP}:4003/orders`, {
      method: "POST", body: JSON.stringify({
        userId: "order-tester", cartId: state.orderCartId,
        items: [{ productId: "p1", quantity: 2, price: 29.99, name: "Wireless Mouse" }],
        totalAmount: 59.98, currency: "USD", shippingAddress: "789 Order Blvd"
      })
    });
    assert(r.status === 201 && r.data.id, "Expected 201");
    state.orderId = r.data.id;
  });
  await test("Get order", async () => {
    const r = await json(`http://${ORDERS_IP}:4003/orders/${state.orderId}`);
    assert(r.status === 200 && r.data.status === "payment_pending", "Expected payment_pending");
  });
  await test("List orders", async () => {
    const r = await json(`http://${ORDERS_IP}:4003/orders`);
    assert(r.status === 200 && Array.isArray(r.data), "Expected array");
  });
  await test("Filter orders by userId", async () => {
    const r = await json(`http://${ORDERS_IP}:4003/orders?userId=order-tester`);
    assert(r.status === 200 && r.data.length >= 1, "Expected >=1 order");
  });
  await test("Order 404", async () => {
    const r = await json(`http://${ORDERS_IP}:4003/orders/nonexistent`);
    assert(r.status === 404, "Expected 404");
  });
  await test("Update order status", async () => {
    const r = await json(`http://${ORDERS_IP}:4003/orders/${state.orderId}`, {
      method: "PUT", body: JSON.stringify({ status: "processing" })
    });
    assert(r.status === 200 && r.data.status === "processing", "Expected processing");
  });
  await test("Invalid order status", async () => {
    const r = await json(`http://${ORDERS_IP}:4003/orders/${state.orderId}`, {
      method: "PUT", body: JSON.stringify({ status: "invalid_status" })
    });
    assert(r.status === 400, "Expected 400");
  });
  await test("Create order missing fields", async () => {
    const r = await json(`http://${ORDERS_IP}:4003/orders`, {
      method: "POST", body: JSON.stringify({ userId: "x" })
    });
    assert(r.status === 400, "Expected 400");
  });
  await test("Cancel order", async () => {
    const rr = await json(`http://${ORDERS_IP}:4003/orders`, {
      method: "POST", body: JSON.stringify({
        userId: "cancel-test", cartId: "c1",
        items: [{ productId: "p2", quantity: 1, price: 49.99, name: "USB-C Hub" }],
        totalAmount: 49.99, currency: "USD"
      })
    });
    const r = await json(`http://${ORDERS_IP}:4003/orders/${rr.data.id}`, {
      method: "PUT", body: JSON.stringify({ status: "cancelled" })
    });
    assert(r.status === 200 && r.data.status === "cancelled", "Expected cancelled");
  });

  // === PAYMENTS (10 tests) ===
  console.log("\n--- Payments ---");
  await test("Payments health", async () => {
    const r = await json(`http://${PAYMENTS_IP}:4004/health`);
    assert(r.status === 200, "Expected 200");
  });
  await test("Validate payment", async () => {
    const r = await json(`http://${PAYMENTS_IP}:4004/payments/validate`, {
      method: "POST", body: JSON.stringify({ orderId: state.orderId, amount: 59.98, currency: "USD", method: "credit_card" })
    });
    assert(r.status === 200, "Expected 200");
  });
  await test("Create payment", async () => {
    const r = await json(`http://${PAYMENTS_IP}:4004/payments`, {
      method: "POST", body: JSON.stringify({
        orderId: state.orderId, amount: 59.98, currency: "USD",
        method: "credit_card", cardLast4: "5678"
      })
    });
    assert(r.status === 201 && r.data.id, "Expected 201");
    state.paymentId = r.data.id;
  });
  await test("Get payment", async () => {
    const r = await json(`http://${PAYMENTS_IP}:4004/payments/${state.paymentId}`);
    assert(r.status === 200 && r.data.status === "succeeded", "Expected succeeded");
  });
  await test("Get payment status", async () => {
    const r = await json(`http://${PAYMENTS_IP}:4004/payments/status/${state.paymentId}`);
    assert(r.status === 200, "Expected 200");
  });
  await test("Confirm payment (payments service)", async () => {
    const r = await json(`http://${PAYMENTS_IP}:4004/payments/confirm`, {
      method: "POST", body: JSON.stringify({ paymentId: state.paymentId, orderId: state.orderId })
    });
    assert(r.status === 200, "Expected 200");
  });
  await test("Payment 404", async () => {
    const r = await json(`http://${PAYMENTS_IP}:4004/payments/nonexistent`);
    assert(r.status === 404, "Expected 404");
  });
  await test("Payment missing orderId", async () => {
    const r = await json(`http://${PAYMENTS_IP}:4004/payments`, {
      method: "POST", body: JSON.stringify({ amount: 10, currency: "USD", method: "credit_card", cardLast4: "0000" })
    });
    assert(r.status === 400, "Expected 400");
  });
  await test("Payment validation - missing amount", async () => {
    const r = await json(`http://${PAYMENTS_IP}:4004/payments/validate`, {
      method: "POST", body: JSON.stringify({ orderId: "x", currency: "USD", method: "credit_card" })
    });
    assert(r.status === 400, "Expected 400");
  });
  await test("Confirm payment on order", async () => {
    const r = await json(`http://${ORDERS_IP}:4003/orders/${state.orderId}/confirm-payment`, {
      method: "POST", body: JSON.stringify({ paymentId: state.paymentId, userEmail: "test@demo.com" })
    });
    assert(r.status === 200 && r.data.paymentId === state.paymentId, "Expected paymentId set");
    state.invoiceIdFromOrder = r.data.invoiceId;
  });

  // === INVOICES (10 tests) ===
  console.log("\n--- Invoices ---");
  await test("Invoices health", async () => {
    const r = await json(`http://${INVOICES_IP}:4005/health`);
    assert(r.status === 200, "Expected 200");
  });
  await test("Create invoice (via orderId)", async () => {
    // Create a new order to test invoice creation
    const oc = await json(`http://${ORDERS_IP}:4003/orders`, {
      method: "POST", body: JSON.stringify({
        userId: "inv-test", cartId: "inv-cart-1",
        items: [{ productId: "p2", quantity: 1, price: 49.99, name: "USB-C Hub" }],
        totalAmount: 49.99, currency: "USD"
      })
    });
    state.invoiceOrderId = oc.data.id;
    const r = await json(`http://${INVOICES_IP}:4005/invoices`, {
      method: "POST", body: JSON.stringify({ orderId: oc.data.id })
    });
    assert(r.status === 201 && r.data.id, "Expected 201");
    state.manualInvoiceId = r.data.id;
  });
  await test("Get invoice", async () => {
    const r = await json(`http://${INVOICES_IP}:4005/invoices/${state.manualInvoiceId}`);
    assert(r.status === 200 && r.data.orderId === state.invoiceOrderId, "Expected matching orderId");
  });
  await test("Invoice idempotency", async () => {
    const r = await json(`http://${INVOICES_IP}:4005/invoices`, {
      method: "POST", body: JSON.stringify({ orderId: state.invoiceOrderId })
    });
    assert(r.data.id === state.manualInvoiceId, "Expected same invoice (idempotent)");
  });
  await test("Invoice PDF", async () => {
    const r = await fetch(`http://${INVOICES_IP}:4005/invoices/${state.manualInvoiceId}/pdf`);
    assert(r.status === 200, "Expected 200");
    const ct = r.headers.get("content-type") || "";
    assert(ct.includes("pdf"), "Expected PDF content-type");
  });
  await test("Invoice 404", async () => {
    const r = await json(`http://${INVOICES_IP}:4005/invoices/nonexistent`);
    assert(r.status === 404, "Expected 404");
  });
  await test("Invoice by orderId", async () => {
    const r = await json(`http://${INVOICES_IP}:4005/invoices/order/${state.invoiceOrderId}`);
    assert(r.status === 200 && r.data.id === state.manualInvoiceId, "Expected matching invoice");
  });
  await test("Invoice from confirm-payment exists", async () => {
    if (!state.invoiceIdFromOrder) { assert(false, "No invoice from order"); return; }
    const r = await json(`http://${INVOICES_IP}:4005/invoices/${state.invoiceIdFromOrder}`);
    assert(r.status === 200, "Expected 200");
  });
  await test("Invoice PDF via gateway", async () => {
    const r = await fetch(`http://${GATEWAY_IP}:4000/api-backend/invoices/${state.manualInvoiceId}/pdf`);
    assert(r.status === 200, "Expected 200");
  });
  await test("Test PDF endpoint", async () => {
    const r = await fetch(`http://${INVOICES_IP}:4005/test-pdf`);
    assert(r.status === 200, "Expected 200");
  });

  // === E2E FLOW (8 tests) ===
  console.log("\n--- E2E Full Flow via Gateway ---");
  await test("E2E: Create cart", async () => {
    const r = await json(`http://${GATEWAY_IP}:4000/api-backend/cart`, {
      method: "POST", body: JSON.stringify({ userId: "e2e-final" })
    });
    assert(r.status === 201, "Expected 201");
    state.e2eCartId = r.data.id;
  });
  await test("E2E: Add item p1", async () => {
    const r = await json(`http://${GATEWAY_IP}:4000/api-backend/cart/${state.e2eCartId}/items`, {
      method: "POST", body: JSON.stringify({ productId: "p1", quantity: 1 })
    });
    assert(r.status === 200, "Expected 200");
  });
  await test("E2E: Add item p2", async () => {
    const r = await json(`http://${GATEWAY_IP}:4000/api-backend/cart/${state.e2eCartId}/items`, {
      method: "POST", body: JSON.stringify({ productId: "p2", quantity: 2 })
    });
    assert(r.status === 200, "Expected 200");
  });
  await test("E2E: Get cart totals", async () => {
    const r = await json(`http://${GATEWAY_IP}:4000/api-backend/cart/${state.e2eCartId}`);
    assert(r.status === 200 && r.data.total > 0, "Expected total > 0");
    state.e2eTotal = r.data.total;
  });
  await test("E2E: Create order", async () => {
    const r = await json(`http://${GATEWAY_IP}:4000/api-backend/orders`, {
      method: "POST", body: JSON.stringify({
        userId: "e2e-final", cartId: state.e2eCartId,
        items: [
          { productId: "p1", quantity: 1, price: 29.99, name: "Wireless Mouse" },
          { productId: "p2", quantity: 2, price: 49.99, name: "USB-C Hub" }
        ],
        totalAmount: 129.97, currency: "USD", shippingAddress: "E2E Final St"
      })
    });
    assert(r.status === 201, "Expected 201");
    state.e2eOrderId = r.data.id;
  });
  await test("E2E: Create payment", async () => {
    const r = await json(`http://${GATEWAY_IP}:4000/api-backend/payments`, {
      method: "POST", body: JSON.stringify({
        orderId: state.e2eOrderId, amount: 129.97, currency: "USD",
        method: "credit_card", cardLast4: "4242"
      })
    });
    assert(r.status === 201, "Expected 201");
    state.e2ePaymentId = r.data.id;
  });
  await test("E2E: Confirm payment + invoice", async () => {
    const r = await json(`http://${GATEWAY_IP}:4000/api-backend/orders/${state.e2eOrderId}/confirm-payment`, {
      method: "POST", body: JSON.stringify({ paymentId: state.e2ePaymentId, userEmail: "e2e@demo.com" })
    });
    assert(r.status === 200 && r.data.invoiceId, "Expected invoiceId");
    state.e2eInvoiceId = r.data.invoiceId;
  });
  await test("E2E: Download invoice PDF", async () => {
    const r = await fetch(`http://${GATEWAY_IP}:4000/api-backend/invoices/${state.e2eInvoiceId}/pdf`);
    assert(r.status === 200, "Expected 200");
    const buf = await r.arrayBuffer();
    assert(buf.byteLength > 100, "Expected PDF content");
  });

  // === SUMMARY ===
  const total = results.length;
  const pass = results.filter(r => r.pass).length;
  const fail = results.filter(r => !r.pass).length;
  console.log("\n" + "=".repeat(60));
  console.log(`RESULTS: ${pass}/${total} passed, ${fail} failed`);
  if (fail > 0) {
    console.log("\nFailures:");
    results.filter(r => !r.pass).forEach(r => console.log(`  - ${r.name}: ${r.err}`));
  }
  console.log("=".repeat(60));
  process.exit(fail > 0 ? 1 : 0);
})();
