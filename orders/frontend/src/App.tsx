import { useEffect, useState } from "react";
import { getOrders, getOrder, createOrder, updateOrderStatus, getProducts, validateCountry, getCarts, type Order, type Product, type CountryInfo, type CartSummary } from "./api";
import "./index.css";

const emptyItem = () => ({ productId: "", quantity: 1, price: 0, name: "" });

export default function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderId, setOrderId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [carts, setCarts] = useState<CartSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createUserId, setCreateUserId] = useState("order-user");
  const [createCartId, setCreateCartId] = useState("");
  const [createItems, setCreateItems] = useState([{ ...emptyItem() }]);
  const [createTotal, setCreateTotal] = useState("");
  const [createCurrency, setCreateCurrency] = useState("USD");
  const [creating, setCreating] = useState(false);
  const [countryCode, setCountryCode] = useState("");
  const [countryInfo, setCountryInfo] = useState<CountryInfo | null>(null);
  const [countryLoading, setCountryLoading] = useState(false);

  useEffect(() => {
    getProducts().then(setProducts).catch(() => setProducts([]));
    getCarts().then(setCarts).catch(() => setCarts([]));
  }, []);

  const loadOrders = () => {
    getOrders()
      .then(setOrders)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleOrderSelect = (id: string) => {
    setOrderId(id);
    const order = orders.find((o) => o.id === id);
    if (order) setSelectedOrder(order);
  };

  const handleLookup = () => {
    if (!orderId.trim()) return;
    setError(null);
    getOrder(orderId.trim())
      .then(setSelectedOrder)
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Not found");
        setSelectedOrder(null);
      });
  };

  const handleStatusUpdate = async (id: string, status: Order["status"]) => {
    setError(null);
    try {
      const updated = await updateOrderStatus(id, status);
      setSelectedOrder(updated);
      loadOrders();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };

  const addCreateItem = () => setCreateItems((prev) => [...prev, { ...emptyItem() }]);
  const removeCreateItem = (i: number) => setCreateItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateCreateItem = (i: number, field: keyof ReturnType<typeof emptyItem>, value: string | number) => {
    setCreateItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));
  };
  const selectProductForItem = (i: number, product: Product) => {
    updateCreateItem(i, "productId", product.id);
    updateCreateItem(i, "name", product.name);
    updateCreateItem(i, "price", product.price);
  };

  const handleCartSelect = (cartId: string) => {
    setCreateCartId(cartId);
    const cart = carts.find((c) => c.id === cartId);
    if (cart) {
      setCreateTotal(cart.total.toString());
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createUserId.trim() || !createCartId.trim()) {
      setError("User ID and Cart ID are required.");
      return;
    }
    const items = createItems
      .map((it) => ({ ...it, quantity: Number(it.quantity) || 0, price: Number(it.price) || 0 }))
      .filter((it) => it.productId.trim() && it.quantity > 0);
    if (items.length === 0) {
      setError("Add at least one item with product ID and quantity.");
      return;
    }
    const totalAmount = parseFloat(createTotal);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      setError("Total amount must be a positive number.");
      return;
    }
    setError(null);
    setCreating(true);
    try {
      const order = await createOrder({
        userId: createUserId.trim(),
        cartId: createCartId.trim(),
        items: items.map((it) => ({ productId: it.productId.trim(), quantity: it.quantity, price: it.price, name: it.name.trim() || it.productId.trim() })),
        totalAmount,
        currency: (createCurrency || "USD").trim().toUpperCase().slice(0, 3),
      });
      setSelectedOrder(order);
      setOrderId(order.id);
      loadOrders();
      setCreateItems([{ ...emptyItem() }]);
      setCreateTotal("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create order failed");
    } finally {
      setCreating(false);
    }
  };

  const statusClass = (s: string) => s.replace(/_/g, "-");

  if (loading) return <div className="app"><p>Loading...</p></div>;

  const cartsWithItems = carts.filter((c) => c.itemCount > 0);

  return (
    <div className="app">
      <h1>Order Processing & Management (CRUD)</h1>
      <p className="card">Service: Orders API – create orders, track status, update order state.</p>
      {error && <p className="error">{error}</p>}

      <div className="card">
        <h2>Create order</h2>
        <form onSubmit={handleCreateOrder}>
          <div className="form-row">
            <div className="form-group">
              <label>User ID *</label>
              <input value={createUserId} onChange={(e) => setCreateUserId(e.target.value)} placeholder="order-user" required />
            </div>
            <div className="form-group">
              <label>Select cart *</label>
              <select value={createCartId} onChange={(e) => handleCartSelect(e.target.value)} required>
                <option value="">-- Select a cart --</option>
                {cartsWithItems.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id.slice(0, 8)}… – {c.itemCount} item(s) – USD {c.total.toFixed(2)}
                  </option>
                ))}
              </select>
              {cartsWithItems.length === 0 && (
                <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                  No carts with items. Add items in the Carts UI first.
                </p>
              )}
            </div>
            <div className="form-group">
              <label>Total amount *</label>
              <input type="number" min={0} step={0.01} value={createTotal} onChange={(e) => setCreateTotal(e.target.value)} placeholder="e.g. 25.00" required />
            </div>
            <div className="form-group">
              <label>Currency</label>
              <input value={createCurrency} onChange={(e) => setCreateCurrency(e.target.value)} maxLength={3} style={{ width: "5rem" }} />
            </div>
          </div>
          <h3 style={{ marginTop: "1rem" }}>Items</h3>
          {createItems.map((item, i) => (
            <div key={i} className="form-row form-row-items">
              <select
                value={item.productId}
                onChange={(e) => {
                  const p = products.find((x) => x.id === e.target.value);
                  if (p) selectProductForItem(i, p);
                }}
                style={{ minWidth: "180px" }}
              >
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (ID: {p.id}) – {p.currency} {p.price.toFixed(2)}</option>
                ))}
              </select>
              <input type="number" min={1} placeholder="Qty" value={item.quantity} onChange={(e) => updateCreateItem(i, "quantity", e.target.value)} style={{ width: "4rem" }} />
              <input type="number" min={0} step={0.01} placeholder="Price" value={item.price || ""} onChange={(e) => updateCreateItem(i, "price", e.target.value)} style={{ width: "5rem" }} />
              <input placeholder="Name" value={item.name} onChange={(e) => updateCreateItem(i, "name", e.target.value)} style={{ flex: 1, minWidth: "80px" }} />
              <button type="button" onClick={() => removeCreateItem(i)} disabled={createItems.length <= 1}>−</button>
            </div>
          ))}
          <button type="button" onClick={addCreateItem} style={{ marginTop: "0.5rem" }}>+ Add item</button>
          <div style={{ marginTop: "1rem" }}>
            <button type="submit" disabled={creating}>{creating ? "Creating…" : "Create order"}</button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Track order</h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label>Select order</label>
            <select value={orderId} onChange={(e) => handleOrderSelect(e.target.value)}>
              <option value="">-- Select an order --</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.id.slice(0, 8)}… – {o.currency} {o.totalAmount.toFixed(2)} – {o.status}
                </option>
              ))}
            </select>
          </div>
          <button type="button" onClick={handleLookup} disabled={!orderId}>Look up</button>
        </div>
      </div>

      <div className="card">
        <h2>Validate shipping country</h2>
        <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: 0 }}>
          Uses <strong>REST Countries API</strong> to validate a country code and get details (currency, region, languages).
        </p>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Country code (e.g. US, IE, IN, DE)</label>
            <input value={countryCode} onChange={(e) => setCountryCode(e.target.value)} placeholder="US" style={{ width: "5rem" }} maxLength={3} />
          </div>
          <button
            type="button"
            disabled={countryLoading || !countryCode.trim()}
            onClick={async () => {
              setCountryLoading(true);
              setCountryInfo(null);
              setError(null);
              try {
                const info = await validateCountry(countryCode.trim());
                setCountryInfo(info);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Invalid country code");
              } finally {
                setCountryLoading(false);
              }
            }}
          >
            {countryLoading ? "Checking…" : "Validate"}
          </button>
        </div>
        {countryInfo && countryInfo.valid && (
          <div style={{ marginTop: "0.75rem", fontSize: "0.9rem" }}>
            <p><strong>{countryInfo.flag} {countryInfo.country}</strong> ({countryInfo.officialName})</p>
            <p>Capital: {countryInfo.capital.join(", ") || "N/A"} | Region: {countryInfo.region} / {countryInfo.subregion}</p>
            <p>Currencies: {Object.entries(countryInfo.currencies).map(([, c]) => `${c.name} (${c.symbol})`).join(", ")}</p>
            <p>Languages: {Object.values(countryInfo.languages).join(", ")}</p>
            <p>Population: {countryInfo.population.toLocaleString()} | Timezones: {countryInfo.timezones.join(", ")}</p>
            <p className="success" style={{ fontSize: "0.85rem" }}>Valid shipping destination (via REST Countries API)</p>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="card">
          <h2>Order {selectedOrder.id.slice(0, 8)}…</h2>
          <p>Status: <span className={`badge ${statusClass(selectedOrder.status)}`}>{selectedOrder.status}</span></p>
          <p>Total: {selectedOrder.currency} {selectedOrder.totalAmount.toFixed(2)}</p>
          <p>Created: {new Date(selectedOrder.createdAt).toLocaleString()}</p>
          {selectedOrder.paymentId && <p>Payment ID: {selectedOrder.paymentId.slice(0, 8)}…</p>}
          {selectedOrder.invoiceId && <p>Invoice ID: {selectedOrder.invoiceId.slice(0, 8)}…</p>}
          <p><strong>Items:</strong></p>
          <ul style={{ paddingLeft: "1.25rem" }}>
            {selectedOrder.items.map((i) => (
              <li key={i.productId}>{i.name} × {i.quantity} @ {i.price.toFixed(2)}</li>
            ))}
          </ul>
          {selectedOrder.status === "payment_pending" && (
            <button type="button" onClick={() => handleStatusUpdate(selectedOrder.id, "paid")}>Mark as paid</button>
          )}
        </div>
      )}

      <h2>All orders</h2>
      <div className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>User</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><button type="button" className="link-btn" onClick={() => { setOrderId(o.id); setSelectedOrder(o); }}>{o.id.slice(0, 8)}…</button></td>
                <td>{o.userId}</td>
                <td>{o.currency} {o.totalAmount.toFixed(2)}</td>
                <td><span className={`badge ${statusClass(o.status)}`}>{o.status}</span></td>
                <td>{new Date(o.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p style={{ color: "#94a3b8" }}>No orders yet.</p>}
      </div>
    </div>
  );
}
