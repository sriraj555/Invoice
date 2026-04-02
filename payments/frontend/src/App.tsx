import { useState, useEffect, FormEvent } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {
  getStripeConfig,
  createPaymentIntent,
  confirmStripePayment,
  getPayment,
  getPaymentStatus,
  getOrders,
  getAllPayments,
  getInvoiceByOrderId,
  getInvoicePdfUrl,
  type Order,
  type Payment,
} from "./api";
import "./index.css";

// Load stripe lazily after fetching the publishable key from the backend
let stripePromise: Promise<Stripe | null> | null = null;

function getStripePromise(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = getStripeConfig().then((cfg) => loadStripe(cfg.publishableKey));
  }
  return stripePromise;
}

// ---------- Stripe Checkout Form ----------
function CheckoutForm({ orders, onPaymentComplete }: { orders: Order[]; onPaymentComplete: () => void }) {
  const stripe = useStripe();
  const elements = useElements();

  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [cartId] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invoicePdfUrl, setInvoicePdfUrl] = useState<string | null>(null);

  // Auto-fill amount and currency when order is selected
  const handleOrderSelect = (id: string) => {
    setOrderId(id);
    const order = orders.find((o) => o.id === id);
    if (order) {
      setAmount(order.totalAmount.toString());
      setCurrency(order.currency);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!stripe || !elements) {
      setError("Stripe has not loaded yet. Please wait.");
      return;
    }

    if (!orderId.trim()) {
      setError("Please select an order.");
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Enter a valid positive amount.");
      return;
    }
    const cur = (currency || "USD").trim().toUpperCase();
    if (cur.length !== 3) {
      setError("Currency must be 3 letters (e.g. USD).");
      return;
    }

    setProcessing(true);

    try {
      // Step 1: Create PaymentIntent on the server
      const intent = await createPaymentIntent(
        orderId.trim(),
        amt,
        cur,
        cartId.trim() || undefined,
        userEmail.trim() || undefined,
      );

      // Step 2: Confirm payment with Stripe.js using the card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setError("Card element not found.");
        setProcessing(false);
        return;
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        intent.clientSecret,
        { payment_method: { card: cardElement } },
      );

      if (stripeError) {
        setError(stripeError.message ?? "Payment failed.");
        setProcessing(false);
        return;
      }

      if (!paymentIntent || paymentIntent.status !== "succeeded") {
        setError(`Payment status: ${paymentIntent?.status ?? "unknown"}`);
        setProcessing(false);
        return;
      }

      // Step 3: Confirm on our backend (verify with Stripe, notify Orders, create invoice)
      const confirmation = await confirmStripePayment(
        intent.paymentIntentId,
        intent.paymentId,
        orderId.trim(),
        userEmail.trim() || undefined,
      );

      setResult(
        `Payment succeeded! Payment ID: ${confirmation.paymentId}. ` +
        `Order confirmed: ${confirmation.orderConfirmed}. ` +
        `Stripe status: ${confirmation.stripeStatus}.`,
      );

      // Try to fetch invoice for download
      try {
        const invoice = await getInvoiceByOrderId(orderId.trim());
        setInvoicePdfUrl(getInvoicePdfUrl(invoice.id));
      } catch {
        // Invoice may not be generated yet (async via SQS)
      }

      onPaymentComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  const pendingOrders = orders.filter((o) => o.status === "payment_pending" || o.status === "pending");

  return (
    <form onSubmit={handleSubmit}>
      <div className="card">
        <h2>Pay with Stripe</h2>
        <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: 0 }}>
          Select an order, then pay with a test card.
          Use card number <code>4242 4242 4242 4242</code>, any future expiry, any CVC.
        </p>

        <div className="form-group">
          <label>Select order</label>
          <select value={orderId} onChange={(e) => handleOrderSelect(e.target.value)}>
            <option value="">-- Select an order --</option>
            {pendingOrders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.id.slice(0, 8)}… – {o.currency} {o.totalAmount.toFixed(2)} – {o.status}
              </option>
            ))}
            {pendingOrders.length === 0 && orders.length > 0 && (
              <option disabled>No pending orders (all paid/completed)</option>
            )}
          </select>
          {orders.length === 0 && (
            <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.25rem" }}>
              No orders found. Create one in the Orders UI first.
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Amount</label>
            <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="form-group" style={{ width: "6rem" }}>
            <label>Currency</label>
            <input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="USD" maxLength={3} />
          </div>
        </div>

        <div className="form-group">
          <label>Email (optional)</label>
          <input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="Email for order confirmation" />
        </div>

        <div className="form-group">
          <label>Card details</label>
          <div style={{
            background: "#0f172a",
            border: "1px solid #475569",
            borderRadius: "6px",
            padding: "0.75rem",
          }}>
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#e2e8f0",
                    "::placeholder": { color: "#64748b" },
                  },
                  invalid: { color: "#f87171" },
                },
              }}
            />
          </div>
        </div>

        <button type="submit" disabled={!stripe || processing || !orderId}>
          {processing ? "Processing..." : "Pay now"}
        </button>

        {result && <p className="success" style={{ marginTop: "0.75rem" }}>{result}</p>}
        {invoicePdfUrl && (
          <a
            href={invoicePdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              marginTop: "0.5rem",
              padding: "0.5rem 1rem",
              background: "#2563eb",
              color: "#fff",
              borderRadius: "6px",
              textDecoration: "none",
              fontSize: "0.9rem",
            }}
          >
            Download Invoice PDF
          </a>
        )}
        {error && <p className="error" style={{ marginTop: "0.75rem" }}>{error}</p>}
      </div>
    </form>
  );
}

// ---------- Payment Status Lookup ----------
function PaymentLookup({ payments }: { payments: Payment[] }) {
  const [paymentId, setPaymentId] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [statusResult, setStatusResult] = useState<{ paymentId: string; orderId: string; status: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lookupInvoiceUrl, setLookupInvoiceUrl] = useState<string | null>(null);

  const handleLookup = async () => {
    if (!paymentId.trim()) return;
    setError(null);
    setStatusResult(null);
    setResult(null);
    setLookupInvoiceUrl(null);
    try {
      const payment = await getPayment(paymentId.trim());
      const status = await getPaymentStatus(paymentId.trim());
      setStatusResult(status);
      setResult(`Payment: ${payment.status}, Order: ${payment.orderId}, Amount: ${payment.currency} ${payment.amount.toFixed(2)}`);

      // Try to fetch invoice for this payment's order
      if (payment.status === "succeeded") {
        try {
          const invoice = await getInvoiceByOrderId(payment.orderId);
          setLookupInvoiceUrl(getInvoicePdfUrl(invoice.id));
        } catch {
          // No invoice yet
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Not found");
      setStatusResult(null);
    }
  };

  return (
    <div className="card">
      <h2>Payment status</h2>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
        <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
          <label>Select payment</label>
          <select value={paymentId} onChange={(e) => setPaymentId(e.target.value)}>
            <option value="">-- Select a payment --</option>
            {payments.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id.slice(0, 8)}… – {p.currency} {p.amount.toFixed(2)} – {p.status}
              </option>
            ))}
          </select>
        </div>
        <button onClick={handleLookup} disabled={!paymentId}>Look up</button>
      </div>
      {payments.length === 0 && (
        <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.25rem" }}>
          No payments yet. Process a payment above first.
        </p>
      )}
      {statusResult && (
        <p style={{ marginTop: "0.5rem" }}>
          Status: <span className="success">{statusResult.status}</span> | Order: {statusResult.orderId}
        </p>
      )}
      {result && <p style={{ marginTop: "0.25rem", fontSize: "0.9rem", color: "#94a3b8" }}>{result}</p>}
      {lookupInvoiceUrl && (
        <a
          href={lookupInvoiceUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            marginTop: "0.5rem",
            padding: "0.5rem 1rem",
            background: "#2563eb",
            color: "#fff",
            borderRadius: "6px",
            textDecoration: "none",
            fontSize: "0.9rem",
          }}
        >
          Download Invoice PDF
        </a>
      )}
      {error && <p className="error" style={{ marginTop: "0.5rem" }}>{error}</p>}
    </div>
  );
}

// ---------- Main App ----------
export default function App() {
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [stripeObj, setStripeObj] = useState<Stripe | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const loadData = () => {
    getOrders().then(setOrders).catch(() => setOrders([]));
    getAllPayments().then(setPayments).catch(() => setPayments([]));
  };

  useEffect(() => {
    getStripePromise()
      .then((s) => {
        setStripeObj(s);
        setStripeLoaded(true);
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Failed to load Stripe");
        setStripeLoaded(true);
      });
    loadData();
  }, []);

  return (
    <div className="app">
      <h1>Payment Processing & Validation</h1>
      <p className="card">
        Service: Payments API (Stripe integrated) – process real payments via Stripe, validate details, check status.
      </p>

      {loadError && <p className="error">Failed to load Stripe: {loadError}</p>}

      {!stripeLoaded && <p style={{ color: "#94a3b8" }}>Loading Stripe...</p>}

      {stripeLoaded && stripeObj && (
        <Elements stripe={stripeObj}>
          <CheckoutForm orders={orders} onPaymentComplete={loadData} />
        </Elements>
      )}

      <PaymentLookup payments={payments} />
    </div>
  );
}
