import { useEffect, useState } from "react";
import {
  getProducts,
  getRecommendations,
  checkInventory,
  validatePrice,
  createProduct,
  updateProduct,
  deleteProduct,
  type Product,
} from "./api";
import "./index.css";

const emptyProduct = (): Partial<Product> => ({
  name: "",
  description: "",
  price: 0,
  currency: "USD",
  stock: 0,
  sku: "",
});

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [recommendations, setRecommendations] = useState<Array<{ productId: string; score: number; comment: string }>>([]);
  const [checkProductId, setCheckProductId] = useState("");
  const [checkQty, setCheckQty] = useState(1);
  useEffect(() => {
    if (products.length && !checkProductId) setCheckProductId(products[0].id);
  }, [products]);
  const [inventoryResult, setInventoryResult] = useState<{ available: boolean } | null>(null);
  const [priceValid, setPriceValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState(emptyProduct());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>(emptyProduct());

  const loadProducts = () => {
    getProducts()
      .then(setProducts)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  };

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
    setError(null);
    checkInventory(checkProductId.trim(), checkQty)
      .then(setInventoryResult)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  };

  const handleValidatePrice = () => {
    setError(null);
    validatePrice(10, "USD").then((r) => setPriceValid(r.valid)).catch(() => setPriceValid(false));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, description, price, currency, stock, sku } = createForm;
    if (!name?.trim() || price == null || price < 0 || stock == null || stock < 0) {
      setError("Name, price (≥0), and stock (≥0) are required.");
      return;
    }
    setError(null);
    try {
      await createProduct({
        name: name.trim(),
        description: (description ?? "").trim(),
        price: Number(price),
        currency: (currency ?? "USD").trim() || "USD",
        stock: Number(stock),
        sku: sku?.trim() || undefined,
      });
      setCreateForm(emptyProduct());
      loadProducts();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    }
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditForm({
      name: p.name,
      description: p.description,
      price: p.price,
      currency: p.currency,
      stock: p.stock,
      sku: p.sku ?? "",
    });
    setError(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setError(null);
    try {
      await updateProduct(editingId, {
        ...(editForm.name !== undefined && { name: editForm.name.trim() }),
        ...(editForm.description !== undefined && { description: editForm.description.trim() }),
        ...(editForm.price !== undefined && { price: Number(editForm.price) }),
        ...(editForm.currency !== undefined && { currency: editForm.currency.trim() }),
        ...(editForm.stock !== undefined && { stock: Number(editForm.stock) }),
        ...(editForm.sku !== undefined && { sku: editForm.sku.trim() || undefined }),
      });
      setEditingId(null);
      setEditForm(emptyProduct());
      loadProducts();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    setError(null);
    try {
      await deleteProduct(id);
      loadProducts();
      if (editingId === id) setEditingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  if (loading) return <div className="app"><p>Loading...</p></div>;

  return (
    <div className="app">
      <h1>Product Catalog & Inventory (CRUD)</h1>
      <p className="card">Service: Products API – create, read, update, delete products; check stock; validate price.</p>
      {error && <p className="error">{error}</p>}

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
        <h2>Create product</h2>
        <form onSubmit={handleCreate}>
          <div className="form-row">
            <div className="form-group">
              <label>Name *</label>
              <input value={createForm.name ?? ""} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} placeholder="Product name" required />
            </div>
            <div className="form-group">
              <label>Price *</label>
              <input type="number" min={0} step={0.01} value={createForm.price ?? ""} onChange={(e) => setCreateForm((f) => ({ ...f, price: e.target.value === "" ? 0 : Number(e.target.value) }))} />
            </div>
            <div className="form-group">
              <label>Stock *</label>
              <input type="number" min={0} value={createForm.stock ?? ""} onChange={(e) => setCreateForm((f) => ({ ...f, stock: e.target.value === "" ? 0 : Number(e.target.value) }))} />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={createForm.description ?? ""} onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description" rows={2} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Currency</label>
              <input value={createForm.currency ?? "USD"} onChange={(e) => setCreateForm((f) => ({ ...f, currency: e.target.value }))} placeholder="USD" maxLength={3} style={{ width: "5rem" }} />
            </div>
            <div className="form-group">
              <label>SKU</label>
              <input value={createForm.sku ?? ""} onChange={(e) => setCreateForm((f) => ({ ...f, sku: e.target.value }))} placeholder="Optional" />
            </div>
          </div>
          <button type="submit">Create product</button>
        </form>
      </div>

      <div className="card">
        <h2>Check inventory</h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="form-group" style={{ marginBottom: 0, minWidth: "200px" }}>
            <label>Product</label>
            <select value={checkProductId} onChange={(e) => setCheckProductId(e.target.value)}>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Quantity</label>
            <input type="number" min={1} value={checkQty} onChange={(e) => setCheckQty(Number(e.target.value) || 1)} />
          </div>
          <button type="button" onClick={handleCheckInventory}>Check</button>
        </div>
        {inventoryResult !== null && (
          <p style={{ marginTop: "0.5rem" }}>
            Available: <span className={inventoryResult.available ? "success" : "error"}>{inventoryResult.available ? "Yes" : "No"}</span>
          </p>
        )}
      </div>

      <div className="card">
        <button type="button" onClick={handleValidatePrice}>Validate price (10 USD) – public API</button>
        {priceValid !== null && <span style={{ marginLeft: "0.5rem" }}>Valid: {priceValid ? "Yes" : "No"}</span>}
      </div>

      <h2>Products</h2>
      <div className="grid">
        {products.map((p) => (
          <div key={p.id} className="card product-card">
            {editingId === p.id ? (
              <form onSubmit={handleUpdate}>
                <div className="form-group">
                  <label>Name</label>
                  <input value={editForm.name ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Price</label>
                  <input type="number" min={0} step={0.01} value={editForm.price ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, price: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label>Stock</label>
                  <input type="number" min={0} value={editForm.stock ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, stock: Number(e.target.value) }))} />
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button type="submit">Save</button>
                  <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <p className="product-id">ID: <code>{p.id}</code></p>
                <h3 style={{ marginTop: 0 }}>{p.name}</h3>
                <p style={{ fontSize: "0.9rem", color: "#94a3b8" }}>{p.description}</p>
                <p><strong>{p.currency} {p.price.toFixed(2)}</strong></p>
                <p>Stock: <span className="badge">{p.stock}</span></p>
                {p.sku && <p>SKU: {p.sku}</p>}
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button type="button" onClick={() => startEdit(p)}>Edit</button>
                  <button type="button" className="btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
