import { useEffect, useState } from "react";
import { getProducts, getRecommendations, checkInventory, validatePrice, type Product } from "./api";
import "./index.css";

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [recommendations, setRecommendations] = useState<Array<{ productId: string; score: number; comment: string }>>([]);
  const [checkProductId, setCheckProductId] = useState("");
  const [checkQty, setCheckQty] = useState(1);
  const [inventoryResult, setInventoryResult] = useState<{ available: boolean } | null>(null);
  const [priceValid, setPriceValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getProducts(), getRecommendations().catch(() => [])])
      .then(([prods, recs]) => {
        setProducts(prods);
        setRecommendations(recs);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, []);

  const handleCheckInventory = () => {
    if (!checkProductId.trim()) return;
    setInventoryResult(null);
    checkInventory(checkProductId.trim(), checkQty)
      .then(setInventoryResult)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  };

  const handleValidatePrice = () => {
    validatePrice(10, "USD").then((r) => setPriceValid(r.valid)).catch(() => setPriceValid(false));
  };

  if (loading) return <div className="app"><p>Loading...</p></div>;
  if (error) return <div className="app"><p className="error">{error}</p></div>;

  return (
    <div className="app">
      <h1>Product Catalog & Inventory</h1>
      <p className="card">Service: Products API – browse products, check stock, validate price.</p>

      {recommendations.length > 0 && (
        <div className="card">
          <h2>Recommendations (classmate API)</h2>
          <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
            {recommendations.map((r) => (
              <li key={r.productId}>Product {r.productId} – {r.score}★ – {r.comment}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <h2>Check inventory</h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Product ID</label>
            <input value={checkProductId} onChange={(e) => setCheckProductId(e.target.value)} placeholder="e.g. p1" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Quantity</label>
            <input type="number" min={1} value={checkQty} onChange={(e) => setCheckQty(Number(e.target.value) || 1)} />
          </div>
          <button onClick={handleCheckInventory}>Check</button>
        </div>
        {inventoryResult !== null && (
          <p style={{ marginTop: "0.5rem" }}>
            Available: <span className={inventoryResult.available ? "success" : "error"}>{inventoryResult.available ? "Yes" : "No"}</span>
          </p>
        )}
      </div>

      <div className="card">
        <button onClick={handleValidatePrice}>Validate price (10 USD) – public API</button>
        {priceValid !== null && <span style={{ marginLeft: "0.5rem" }}>Valid: {priceValid ? "Yes" : "No"}</span>}
      </div>

      <h2>Products</h2>
      <div className="grid">
        {products.map((p) => (
          <div key={p.id} className="card">
            <h3 style={{ marginTop: 0 }}>{p.name}</h3>
            <p style={{ fontSize: "0.9rem", color: "#94a3b8" }}>{p.description}</p>
            <p><strong>{p.currency} {p.price.toFixed(2)}</strong></p>
            <p>Stock: <span className="badge">{p.stock}</span></p>
            {p.sku && <p>SKU: {p.sku}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
