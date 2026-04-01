import { useState } from "react";
import { createInvoice, getInvoiceByOrderId, getInvoice } from "./api";
import { getInvoicePdfUrl } from "./config";
import "./index.css";

export default function App() {
  const [orderId, setOrderId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [invoice, setInvoice] = useState<Awaited<ReturnType<typeof getInvoice>> | null>(null);
  const [created, setCreated] = useState<{ id: string; orderId: string; amount: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!orderId.trim()) return;
    setError(null);
    setCreated(null);
    setLoading(true);
    try {
      const r = await createInvoice(orderId.trim());
      setCreated(r);
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

  return (
    <div className="app">
      <h1>Invoice & Receipt Generator</h1>
      <p className="card">Service: Invoices API – generate invoices, get by order ID, download PDF.</p>

      <div className="card">
        <h2>Create invoice</h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label>Order ID</label>
            <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Order ID" />
          </div>
          <button onClick={handleCreate} disabled={loading}>Generate invoice</button>
        </div>
        {created && (
          <p className="success" style={{ marginTop: "0.5rem" }}>
            Created invoice {created.id} for order {created.orderId}. Amount: {created.amount.toFixed(2)}.
          </p>
        )}
      </div>

      <div className="card">
        <h2>Get invoice by order ID</h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label>Order ID</label>
            <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Order ID" />
          </div>
          <button onClick={handleLookupByOrder} disabled={loading}>Look up</button>
        </div>
      </div>

      <div className="card">
        <h2>Get invoice by ID</h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label>Invoice ID</label>
            <input value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} placeholder="Invoice ID" />
          </div>
          <button onClick={handleLookupById} disabled={loading}>Look up</button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {invoice && (
        <div className="card">
          <h2>Invoice {invoice.id.slice(0, 8)}…</h2>
          <p>Order: {invoice.orderId} | Amount: {invoice.currency} {invoice.amount.toFixed(2)}</p>
          <p>Created: {new Date(invoice.createdAt).toLocaleString()}</p>
          <p><strong>Items:</strong></p>
          <ul>
            {invoice.items.map((item, i) => (
              <li key={i} className="invoice-item">
                {item.sku ? `[${item.sku}] ` : ""}{item.name} × {item.quantity} @ {item.price.toFixed(2)}
              </li>
            ))}
          </ul>
          <a href={getInvoicePdfUrl(invoice.id)} target="_blank" rel="noopener noreferrer" style={{ color: "#38bdf8" }}>
            Download PDF
          </a>
        </div>
      )}
    </div>
  );
}
