import { useState, useEffect, FormEvent } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {
  getStripeConfig,
  createPaymentIntent,
  confirmStripePayment,
  getPayment,
  getPaymentStatus,
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
function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState("100");
  const [currency, setCurrency] = useState("USD");
  const [cartId, setCartId] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!stripe || !elements) {
      setError("Stripe has not loaded yet. Please wait.");
      return;
    }

    if (!orderId.trim()) {
      setError("Order ID is required. Create an order in Orders UI first.");
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="card">
        <h2>Pay with Stripe</h2>
        <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: 0 }}>
          Enter an <strong>Order ID</strong> from the Orders UI, then pay with a test card.
          Use card number <code>4242 4242 4242 4242</code>, any future expiry, any CVC.
        </p>

        <div className="form-group">
          <label>Order ID</label>
          <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Order ID from Orders UI" />
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
          <label>Cart ID (optional)</label>
          <input value={cartId} onChange={(e) => setCartId(e.target.value)} placeholder="Cart ID to validate amount" />
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

        <button type="submit" disabled={!stripe || processing}>
          {processing ? "Processing..." : "Pay now"}
        </button>

        {result && <p className="success" style={{ marginTop: "0.75rem" }}>{result}</p>}
        {error && <p className="error" style={{ marginTop: "0.75rem" }}>{error}</p>}
      </div>
    </form>
  );
}

// ---------- Payment Status Lookup ----------
function PaymentLookup() {
  const [paymentId, setPaymentId] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [statusResult, setStatusResult] = useState<{ paymentId: string; orderId: string; status: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    if (!paymentId.trim()) return;
    setError(null);
    setStatusResult(null);
    setResult(null);
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
      {result && <p style={{ marginTop: "0.25rem", fontSize: "0.9rem", color: "#94a3b8" }}>{result}</p>}
      {error && <p className="error" style={{ marginTop: "0.5rem" }}>{error}</p>}
    </div>
  );
}

// ---------- Main App ----------
export default function App() {
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [stripeObj, setStripeObj] = useState<Stripe | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

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
          <CheckoutForm />
        </Elements>
      )}

      <PaymentLookup />
    </div>
  );
}
