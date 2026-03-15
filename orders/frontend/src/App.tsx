import { useEffect, useState } from "react";
import { getOrders, getOrder, updateOrderStatus, type Order } from "./api";
import "./index.css";

export default function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderId, setOrderId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = () => {
    getOrders()
      .then(setOrders)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, []);

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

  const statusClass = (s: string) => s.replace(/_/g, "-");

  if (loading) return <div className="app"><p>Loading...</p></div>;

  return (
    <div className="app">
      <h1>Order Processing & Management</h1>
      <p className="card">Service: Orders API – create orders, track status, update order state.</p>

      <div className="card">
        <h2>Track order</h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label>Order ID</label>
            <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Paste order ID" />
          </div>
          <button onClick={handleLookup}>Look up</button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

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
            <button onClick={() => handleStatusUpdate(selectedOrder.id, "paid")}>Mark as paid</button>
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
                <td><button type="button" style={{ background: "transparent", color: "#38bdf8", textDecoration: "underline" }} onClick={() => { setOrderId(o.id); setSelectedOrder(o); }}>{o.id.slice(0, 8)}…</button></td>
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
