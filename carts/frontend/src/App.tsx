import { useEffect, useState, useRef } from "react";
import {
  createCart,
  getCart,
  getCartSummary,
  addToCart,
  removeFromCart,
  applyDiscount,
  getProducts,
  createOrder,
  validatePayment,
  processPayment,
  convertCartCurrency,
  type Cart,
  type CartSummary,
  type Product,
} from "./api";
import "./index.css";

const USER_ID = "cart-user-" + Date.now();

export default function App() {
  const [cartId, setCartId] = useState<string | null>(null);
  const cartIdRef = useRef<string | null>(null);
  const [cart, setCart] = useState<(Cart & { subtotal?: number; total?: number }) | null>(null);
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [discountCode, setDiscountCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<{ orderId: string } | null>(null);
  const [converted, setConverted] = useState<Record<string, number> | null>(null);
  const [converting, setConverting] = useState(false);

  // Keep ref in sync with state for immediate access
  const updateCartId = (id: string) => {
    cartIdRef.current = id;
    setCartId(id);
  };

  // Create a new cart and return its ID
  const createNewCart = async (): Promise<string> => {
    const created = await createCart(USER_ID);
    updateCartId(created.id);
    return created.id;
  };

  // Ensure a valid cart exists, recreate if Lambda recycled
  const ensureCart = async (): Promise<string> => {
    const cid = cartIdRef.current;
    if (cid) {
      try {
        await getCart(cid);
        return cid;
      } catch {
        // Cart gone (Lambda recycled), recreate
      }
    }
    return await createNewCart();
  };

  const loadCart = async () => {
    let cid = cartIdRef.current;

    if (cid) {
      try {
        const [cartData, summaryData] = await Promise.all([getCart(cid), getCartSummary(cid)]);
        setCart(cartData);
        setSummary(summaryData);
        return cid;
      } catch {
        // Cart not found (Lambda recycled), recreate below
      }
    }

    cid = await createNewCart();
    const [cartData, summaryData] = await Promise.all([getCart(cid), getCartSummary(cid)]);
    setCart(cartData);
    setSummary(summaryData);
    return cid;
  };

  useEffect(() => {
    getProducts()
      .then((list) => {
        setProducts(list);
        if (list.length && !productId) setProductId(list[0].id);
      })
      .catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    loadCart().catch((e) => setError(e instanceof Error ? e.message : "Failed")).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (products.length && !productId) setProductId(products[0].id);
  }, [products]);

  const handleAdd = async () => {
    setError(null);
    try {
      let cid = cartIdRef.current;

      // Ensure we have a cart ID
      if (!cid) {
        cid = await createNewCart();
      }

      try {
        await addToCart(cid, productId.trim(), quantity);
      } catch (addErr) {
        // Cart not found - Lambda recycled, recreate and retry
        if (addErr instanceof Error && addErr.message.toLowerCase().includes("not found")) {
          cid = await createNewCart();
          await addToCart(cid, productId.trim(), quantity);
        } else {
          throw addErr;
        }
      }

      // Reload cart data using the valid cart ID
      const [cartData, summaryData] = await Promise.all([getCart(cid), getCartSummary(cid)]);
      setCart(cartData);
      setSummary(summaryData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleRemove = async (pid: string) => {
    setError(null);
    try {
      const cid = await ensureCart();
      await removeFromCart(cid, pid);
      const [cartData, summaryData] = await Promise.all([getCart(cid), getCartSummary(cid)]);
      setCart(cartData);
      setSummary(summaryData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleDiscount = async () => {
    if (!discountCode.trim()) return;
    setError(null);
    try {
      const cid = await ensureCart();
      await applyDiscount(cid, discountCode.trim());
      const [cartData, summaryData] = await Promise.all([getCart(cid), getCartSummary(cid)]);
      setCart(cartData);
      setSummary(summaryData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid code");
    }
  };

  const handleCheckoutAndPay = async () => {
    const cid = cartIdRef.current;
    if (!cid || !cart || !summary || cart.items.length === 0) {
      setError("Cart is empty. Add items first.");
      return;
    }
    setError(null);
    setPaymentSuccess(null);
    setPaying(true);
    try {
      const orderItems = cart.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        price: i.price ?? 0,
        name: (i.name ?? i.productId).trim() || i.productId,
      }));
      const order = await createOrder({
        userId: USER_ID,
        cartId: cid,
        items: orderItems,
        totalAmount: summary.total,
        currency: "USD",
      });
      const valid = await validatePayment(order.id, summary.total, "USD", cid);
      if (!valid.valid) {
        setError("Payment validation failed. Amount may not match cart total.");
        setPaying(false);
        return;
      }
      const payment = await processPayment(order.id, summary.total, "USD", cid);
      if (payment.status === "succeeded" || payment.status === "paid") {
        setPaymentSuccess({ orderId: order.id });
        await loadCart();
      } else {
        setError("Payment did not complete.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="app"><p>Loading...</p></div>;

  return (
    <div className="app">
      <h1>Shopping Cart Management</h1>
      <p className="card">Service: Cart API – add/remove items, apply discounts, view summary.</p>

      {cartId && (
        <p className="card">Cart ID: <strong>{cartId}</strong></p>
      )}

      <div className="card">
        <h2>Add item</h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="form-group" style={{ marginBottom: 0, minWidth: "200px" }}>
            <label>Product</label>
            <select value={productId} onChange={(e) => setProductId(e.target.value)}>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Quantity</label>
            <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value) || 1)} style={{ width: "80px" }} />
          </div>
          <button onClick={handleAdd} disabled={!productId}>Add to cart</button>
        </div>
      </div>

      <div className="card">
        <h2>Discount</h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Code (SAVE10, SAVE20)</label>
            <input value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} placeholder="SAVE10" style={{ width: "120px" }} />
          </div>
          <button onClick={handleDiscount}>Apply</button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {summary && (
        <div className="card">
          <h2>Cart summary</h2>
          <p>Items: {summary.itemCount} | Subtotal: USD {summary.subtotal.toFixed(2)} | Total: USD {summary.total.toFixed(2)}</p>
          {summary.itemCount > 0 && (
            <>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <button
                  type="button"
                  onClick={async () => {
                    const cid = cartIdRef.current;
                    if (!cid) return;
                    setConverting(true);
                    setConverted(null);
                    try {
                      const r = await convertCartCurrency(cid, "EUR,GBP,JPY,INR");
                      setConverted(r.converted);
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Conversion failed");
                    } finally {
                      setConverting(false);
                    }
                  }}
                  disabled={converting}
                >
                  {converting ? "Converting…" : "Show in other currencies"}
                </button>
              </div>
              {converted && (
                <div style={{ marginBottom: "0.75rem", fontSize: "0.9rem", color: "#94a3b8" }}>
                  {Object.entries(converted).map(([cur, val]) => (
                    <span key={cur} style={{ marginRight: "1rem" }}>
                      <strong>{cur}</strong> {val.toFixed(2)}
                    </span>
                  ))}
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>(via Frankfurter API)</span>
                </div>
              )}
              <button
                type="button"
                className="btn-checkout"
                onClick={handleCheckoutAndPay}
                disabled={paying}
              >
                {paying ? "Processing…" : "Checkout & Pay"}
              </button>
            </>
          )}
        </div>
      )}

      {paymentSuccess && (
        <div className="card success-card">
          <h2>Payment successful</h2>
          <p className="success">Order ID: <strong>{paymentSuccess.orderId}</strong></p>
          <p>Your cart has been cleared. You can get an invoice in the <a href="http://invoices-frontend-533267029271.s3-website-us-east-1.amazonaws.com" target="_blank" rel="noopener noreferrer">Invoices UI</a> using this order ID.</p>
        </div>
      )}

      {cart && cart.items.length > 0 && (
        <div className="card">
          <h2>Items</h2>
          <ul>
            {cart.items.map((i) => (
              <li key={i.productId} className="cart-item">
                <span>{i.name ?? i.productId} × {i.quantity} @ {(i.price ?? 0).toFixed(2)}</span>
                <button onClick={() => handleRemove(i.productId)}>Remove</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {cart && cart.items.length === 0 && summary?.itemCount === 0 && (
        <p className="card">Cart is empty. Select a product above and add to cart.</p>
      )}
    </div>
  );
}
