import { useEffect, useState } from "react";
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
  type Cart,
  type CartSummary,
  type Product,
} from "./api";
import "./index.css";

const USER_ID = "cart-user-" + Date.now();

export default function App() {
  const [cartId, setCartId] = useState<string | null>(null);
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

  const loadCart = async () => {
    let cid = cartId;
    if (!cid) {
      const created = await createCart(USER_ID);
      cid = created.id;
      setCartId(cid);
    }
    const [cartData, summaryData] = await Promise.all([getCart(cid), getCartSummary(cid)]);
    setCart(cartData);
    setSummary(summaryData);
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
    if (!cartId) return;
    setError(null);
    try {
      await addToCart(cartId, productId.trim(), quantity);
      await loadCart();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleRemove = async (productId: string) => {
    if (!cartId) return;
    setError(null);
    try {
      await removeFromCart(cartId, productId);
      await loadCart();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleDiscount = async () => {
    if (!cartId || !discountCode.trim()) return;
    setError(null);
    try {
      await applyDiscount(cartId, discountCode.trim());
      await loadCart();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid code");
    }
  };

  const handleCheckoutAndPay = async () => {
    if (!cartId || !cart || !summary || cart.items.length === 0) {
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
        cartId,
        items: orderItems,
        totalAmount: summary.total,
        currency: "USD",
      });
      const valid = await validatePayment(order.id, summary.total, "USD", cartId);
      if (!valid.valid) {
        setError("Payment validation failed. Amount may not match cart total.");
        setPaying(false);
        return;
      }
      const payment = await processPayment(order.id, summary.total, "USD", cartId);
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
            <button
              type="button"
              className="btn-checkout"
              onClick={handleCheckoutAndPay}
              disabled={paying}
            >
              {paying ? "Processing…" : "Checkout & Pay"}
            </button>
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
