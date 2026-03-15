import { useEffect, useState } from "react";
import {
  createCart,
  getCart,
  getCartSummary,
  addToCart,
  removeFromCart,
  applyDiscount,
  type Cart,
  type CartSummary,
} from "./api";
import "./index.css";

const USER_ID = "cart-user-" + Date.now();

export default function App() {
  const [cartId, setCartId] = useState<string | null>(null);
  const [cart, setCart] = useState<(Cart & { subtotal?: number; total?: number }) | null>(null);
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [productId, setProductId] = useState("p1");
  const [quantity, setQuantity] = useState(1);
  const [discountCode, setDiscountCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    loadCart().catch((e) => setError(e instanceof Error ? e.message : "Failed")).finally(() => setLoading(false));
  }, []);

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
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Product ID</label>
            <input value={productId} onChange={(e) => setProductId(e.target.value)} placeholder="p1 or p2" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Quantity</label>
            <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value) || 1)} style={{ width: "80px" }} />
          </div>
          <button onClick={handleAdd}>Add to cart</button>
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
        <p className="card">Cart is empty. Add items above (use product IDs from Product Catalog, e.g. p1, p2).</p>
      )}
    </div>
  );
}
