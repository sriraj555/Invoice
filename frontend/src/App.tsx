<<<<<<< HEAD
import { useEffect, useState } from "react";
import {
  createInvoice,
  getInvoiceByOrderId,
  getInvoice,
  getAllInvoices,
  getInvoiceQrCode,
  getOrders,
  type Invoice,
  type Order,
  type QrCodeResult,
} from "./api";
=======
import { useState } from "react";
import { createInvoice, getInvoiceByOrderId, getInvoice } from "./api";
>>>>>>> 939fbba14dc2753b1eaa48d3ee547d81e638fe50
import { getInvoicePdfUrl } from "./config";
import "./index.css";

export default function App() {
<<<<<<< HEAD
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orderId, setOrderId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [created, setCreated] = useState<{ id: string; orderId: string; amount: number } | null>(null);
  const [qrCode, setQrCode] = useState<QrCodeResult | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    getOrders().then(setOrders).catch(() => setOrders([]));
    getAllInvoices().then(setInvoices).catch(() => setInvoices([]));
  };

  useEffect(() => {
    loadData();
  }, []);

=======
  const [orderId, setOrderId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [invoice, setInvoice] = useState<Awaited<ReturnType<typeof getInvoice>> | null>(null);
  const [created, setCreated] = useState<{ id: string; orderId: string; amount: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

>>>>>>> 939fbba14dc2753b1eaa48d3ee547d81e638fe50
  const handleCreate = async () => {
    if (!orderId.trim()) return;
    setError(null);
    setCreated(null);
    setLoading(true);
    try {
      const r = await createInvoice(orderId.trim());
      setCreated(r);
<<<<<<< HEAD
      loadData();
=======
>>>>>>> 939fbba14dc2753b1eaa48d3ee547d81e638fe50
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLookupByOrder = async () => {
    if (!orderId.trim()) return;
    setError(null);
    setInvoice(null);
    setCreated(null);
<<<<<<< HEAD
    setQrCode(null);
=======
>>>>>>> 939fbba14dc2753b1eaa48d3ee547d81e638fe50
    setLoading(true);
    try {
      const inv = await getInvoiceByOrderId(orderId.trim());
      setInvoice(inv);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Not found");
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLookupById = async () => {
    if (!invoiceId.trim()) return;
    setError(null);
    setInvoice(null);
    setCreated(null);
<<<<<<< HEAD
    setQrCode(null);
=======
>>>>>>> 939fbba14dc2753b1eaa48d3ee547d81e638fe50
    setLoading(true);
    try {
      const inv = await getInvoice(invoiceId.trim());
      setInvoice(inv);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Not found");
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  const handleGenerateQr = async (invId: string) => {
    setQrLoading(true);
    setQrCode(null);
    try {
      const qr = await getInvoiceQrCode(invId);
      setQrCode(qr);
    } catch (e) {
      setError(e instanceof Error ? e.message : "QR code generation failed");
    } finally {
      setQrLoading(false);
    }
  };

  return (
    <div className="app">
      <h1>Invoice & Receipt Generator</h1>
      <p className="card">Service: Invoices API – generate invoices, get by order ID, download PDF, generate QR code.</p>
=======
  return (
    <div className="app">
      <h1>Invoice & Receipt Generator</h1>
      <p className="card">Service: Invoices API – generate invoices, get by order ID, download PDF.</p>
>>>>>>> 939fbba14dc2753b1eaa48d3ee547d81e638fe50

      <div className="card">
        <h2>Create invoice</h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
<<<<<<< HEAD
            <label>Select order</label>
            <select value={orderId} onChange={(e) => setOrderId(e.target.value)}>
              <option value="">-- Select an order --</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.id.slice(0, 8)}… – {o.currency} {o.totalAmount.toFixed(2)} – {o.status}
                </option>
              ))}
            </select>
          </div>
          <button onClick={handleCreate} disabled={loading || !orderId}>Generate invoice</button>
        </div>
        {orders.length === 0 && (
          <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.25rem" }}>
            No orders found. Create one in the Orders UI first.
          </p>
        )}
        {created && (
          <p className="success" style={{ marginTop: "0.5rem" }}>
            Created invoice {created.id.slice(0, 8)}… for order {created.orderId.slice(0, 8)}…. Amount: {created.amount.toFixed(2)}.
=======
            <label>Order ID</label>
            <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Order ID" />
          </div>
          <button onClick={handleCreate} disabled={loading}>Generate invoice</button>
        </div>
        {created && (
          <p className="success" style={{ marginTop: "0.5rem" }}>
            Created invoice {created.id} for order {created.orderId}. Amount: {created.amount.toFixed(2)}.
>>>>>>> 939fbba14dc2753b1eaa48d3ee547d81e638fe50
          </p>
        )}
      </div>

      <div className="card">
<<<<<<< HEAD
        <h2>Look up invoice by order</h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label>Select order</label>
            <select value={orderId} onChange={(e) => setOrderId(e.target.value)}>
              <option value="">-- Select an order --</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.id.slice(0, 8)}… – {o.currency} {o.totalAmount.toFixed(2)} – {o.status}
                </option>
              ))}
            </select>
          </div>
          <button onClick={handleLookupByOrder} disabled={loading || !orderId}>Look up</button>
=======
        <h2>Get invoice by order ID</h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label>Order ID</label>
            <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Order ID" />
          </div>
          <button onClick={handleLookupByOrder} disabled={loading}>Look up</button>
>>>>>>> 939fbba14dc2753b1eaa48d3ee547d81e638fe50
        </div>
      </div>

      <div className="card">
<<<<<<< HEAD
        <h2>Look up invoice by ID</h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label>Select invoice</label>
            <select value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)}>
              <option value="">-- Select an invoice --</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.id.slice(0, 8)}… – {inv.currency} {inv.amount.toFixed(2)} – Order: {inv.orderId.slice(0, 8)}…
                </option>
              ))}
            </select>
          </div>
          <button onClick={handleLookupById} disabled={loading || !invoiceId}>Look up</button>
        </div>
        {invoices.length === 0 && (
          <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.25rem" }}>
            No invoices yet. Generate one above.
          </p>
        )}
=======
        <h2>Get invoice by ID</h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label>Invoice ID</label>
            <input value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} placeholder="Invoice ID" />
          </div>
          <button onClick={handleLookupById} disabled={loading}>Look up</button>
        </div>
>>>>>>> 939fbba14dc2753b1eaa48d3ee547d81e638fe50
      </div>

      {error && <p className="error">{error}</p>}

      {invoice && (
        <div className="card">
          <h2>Invoice {invoice.id.slice(0, 8)}…</h2>
<<<<<<< HEAD
          <p>Order: {invoice.orderId.slice(0, 8)}… | Amount: {invoice.currency} {invoice.amount.toFixed(2)}</p>
=======
          <p>Order: {invoice.orderId} | Amount: {invoice.currency} {invoice.amount.toFixed(2)}</p>
>>>>>>> 939fbba14dc2753b1eaa48d3ee547d81e638fe50
          <p>Created: {new Date(invoice.createdAt).toLocaleString()}</p>
          <p><strong>Items:</strong></p>
          <ul>
            {invoice.items.map((item, i) => (
              <li key={i} className="invoice-item">
                {item.sku ? `[${item.sku}] ` : ""}{item.name} × {item.quantity} @ {item.price.toFixed(2)}
              </li>
            ))}
          </ul>
<<<<<<< HEAD
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
            <a href={getInvoicePdfUrl(invoice.id)} target="_blank" rel="noopener noreferrer" style={{ color: "#38bdf8" }}>
              Download PDF
            </a>
            <button
              type="button"
              onClick={() => handleGenerateQr(invoice.id)}
              disabled={qrLoading}
              style={{ fontSize: "0.85rem" }}
            >
              {qrLoading ? "Generating…" : "Generate QR Code"}
            </button>
          </div>
          {qrCode && (
            <div style={{ marginTop: "0.75rem" }}>
              <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                QR Code (via <strong>QR Server API</strong> – public API):
              </p>
              <img
                src={qrCode.qrCodeUrl}
                alt="Invoice QR Code"
                style={{ width: 200, height: 200, background: "#fff", borderRadius: 8, padding: 8 }}
              />
            </div>
          )}
        </div>
      )}

      {invoices.length > 0 && (
        <>
          <h2>All invoices</h2>
          <div className="card" style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Order ID</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <button
                        type="button"
                        className="link-btn"
                        onClick={() => { setInvoiceId(inv.id); setInvoice(inv); setQrCode(null); }}
                      >
                        {inv.id.slice(0, 8)}…
                      </button>
                    </td>
                    <td>{inv.orderId.slice(0, 8)}…</td>
                    <td>{inv.currency} {inv.amount.toFixed(2)}</td>
                    <td>{new Date(inv.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
=======
          <a href={getInvoicePdfUrl(invoice.id)} target="_blank" rel="noopener noreferrer" style={{ color: "#38bdf8" }}>
            Download PDF
          </a>
        </div>
      )}
>>>>>>> 939fbba14dc2753b1eaa48d3ee547d81e638fe50
    </div>
  );
}
