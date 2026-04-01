import { useState } from "react";
import { validatePayment, processPayment, getPayment, getPaymentStatus } from "./api";
import "./index.css";

export default function App() {
  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState("100");
  const [currency, setCurrency] = useState("USD");
  const [cartId, setCartId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [statusResult, setStatusResult] = useState<{ paymentId: string; orderId: string; status: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateInputs = (): number | null => {
    if (!orderId.trim()) {
      setError("Order ID is required. Create an order in Orders UI (port 3013) first.");
      return null;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Enter a valid positive amount (e.g. 10.00).");
      return null;
    }
    const curr = (currency || "USD").trim().toUpperCase();
    if (curr.length !== 3) {
      setError("Currency must be 3 letters (e.g. USD).");
      return null;
    }
    setError(null);
    return amt;
  };

  const handleValidate = async () => {
    setResult(null);
    const amt = validateInputs();
    if (amt === null) return;
    try {
      const r = await validatePayment(orderId.trim(), amt, (currency || "USD").trim().toUpperCase(), cartId.trim() || undefined);
      setResult(r.valid ? "Valid" : "Invalid");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Validation failed");
    }
  };

  const handleProcess = async () => {
    setResult(null);
    const amt = validateInputs();
    if (amt === null) return;
    try {
      const r = await processPayment(orderId.trim(), amt, (currency || "USD").trim().toUpperCase(), cartId.trim() || undefined);
      setResult(`Payment ${r.status}. ID: ${r.id}. Order confirmed: ${r.orderConfirmed ?? false}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
    }
  };

  const handleLookup = async () => {
    if (!paymentId.trim()) return;
    setError(null);
    setStatusResult(null);
    try {
      const payment = await getPayment(paymentId.trim());
      const status = await getPaymentStatus(paymentId.trim());
      setStatusResult(status);
      setResult(`Payment: ${payment.status}, Order: ${payment.orderId}, Amount: ${payment.currency} ${payment.amount.toFixed(2)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Not found");
      setStatusResult(null);
    }
  };

  return (
    <div className="app">
      <h1>Payment Processing & Validation</h1>
      <p className="card">Service: Payments API – validate payment details, process transactions, check status.</p>
      <p className="card" style={{ fontSize: "0.9rem", color: "#94a3b8" }}>
        Use an <strong>Order ID</strong> from the Orders UI (<a href="http://orders-frontend-851725276040.s3-website-us-east-1.amazonaws.com" target="_blank" rel="noopener noreferrer">Orders UI</a>). Create an order there first, then enter that Order ID and the order total here. Optionally add Cart ID to validate amount against cart total.
      </p>

      <div className="card">
        <h2>Validate payment</h2>
        <div className="form-group">
          <label>Order ID</label>
          <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Order ID" />
        </div>
        <div className="form-group">
          <label>Amount</label>
          <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Currency (3 letters)</label>
          <input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="USD" maxLength={3} style={{ width: "5rem" }} />
        </div>
        <div className="form-group">
          <label>Cart ID (optional – validate against cart total)</label>
          <input value={cartId} onChange={(e) => setCartId(e.target.value)} placeholder="Cart ID" />
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={handleValidate}>Validate</button>
          <button onClick={handleProcess}>Process payment</button>
        </div>
        {result && <p className="success" style={{ marginTop: "0.5rem" }}>{result}</p>}
      </div>

      <div className="card">
        <h2>Payment status</h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label>Payment ID</label>
            <input value={paymentId} onChange={(e) => setPaymentId(e.target.value)} placeholder="Payment ID" />
          </div>
          <button onClick={handleLookup}>Look up</button>
        </div>
        {statusResult && (
          <p style={{ marginTop: "0.5rem" }}>
            Status: <span className="success">{statusResult.status}</span> | Order: {statusResult.orderId}
          </p>
        )}
      </div>

      {error && <p className="error">{error}</p>}
    </div>
  );
}
