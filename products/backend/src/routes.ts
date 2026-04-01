import { Router, Request, Response } from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  createProductWithId,
  updateProduct,
  deleteProduct,
  checkStock,
  reserveStock,
  releaseStock,
  getRecommendations,
} from "./store";
import { createProductSchema, checkInventorySchema } from "./validation";
import { validatePriceWithPublicApi } from "./publicApi";

const router = Router();

router.get("/recommendations", (_req: Request, res: Response) => {
  const recs = getRecommendations();
  res.json(recs);
});

router.get("/products", (_req: Request, res: Response) => {
  const products = getAllProducts();
  res.json(products);
});

router.get("/products/:id", (req: Request, res: Response) => {
  const product = getProductById(req.params.id);
  if (!product) {
    res.status(404).json({ message: "Product not found" });
    return;
  }
  res.json(product);
});

router.post("/products", (req: Request, res: Response) => {
  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    return;
  }
  const product = createProduct(parsed.data);
  res.status(201).json(product);
});

router.post("/products/inventory/check", (req: Request, res: Response) => {
  const parsed = checkInventorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    return;
  }
  const available = checkStock(parsed.data.productId, parsed.data.quantity);
  res.json({
    productId: parsed.data.productId,
    quantity: parsed.data.quantity,
    available,
  });
});

router.post("/products/validate-price", async (req: Request, res: Response) => {
  const amount = typeof req.body?.amount === "number" ? req.body.amount : 0;
  const currency = typeof req.body?.currency === "string" ? req.body.currency : "USD";
  const result = await validatePriceWithPublicApi(amount, currency);
  if (!result.valid) {
    res.status(400).json({ valid: false, message: result.message });
    return;
  }
  res.json({ valid: true });
});

router.put("/products/:id", (req: Request, res: Response) => {
  const id = req.params.id;
  const body = req.body as Record<string, unknown>;
  const name = body.name !== undefined ? String(body.name) : undefined;
  const description = body.description !== undefined ? String(body.description) : undefined;
  const price = body.price !== undefined ? Number(body.price) : undefined;
  const currency = body.currency !== undefined ? String(body.currency) : undefined;
  const stock = body.stock !== undefined ? Number(body.stock) : undefined;
  const sku = body.sku !== undefined ? String(body.sku) : undefined;

  let product = updateProduct(id, {
    ...(name !== undefined && { name }),
    ...(description !== undefined && { description }),
    ...(price !== undefined && { price }),
    ...(currency !== undefined && { currency }),
    ...(stock !== undefined && { stock }),
    ...(sku !== undefined && { sku }),
  });

  if (!product) {
    if (name !== undefined && price !== undefined && stock !== undefined) {
      product = createProductWithId(id, {
        name,
        description: description ?? "",
        price,
        currency: currency ?? "USD",
        stock,
        sku: sku ?? undefined,
      });
      res.json(product);
      return;
    }
    res.status(404).json({ message: "Product not found" });
    return;
  }
  res.json(product);
});

router.post("/products/:id/decrease-stock", (req: Request, res: Response) => {
  const id = req.params.id;
  const quantity = typeof req.body?.quantity === "number" ? req.body.quantity : undefined;
  if (quantity === undefined || quantity < 1) {
    res.status(400).json({ message: "quantity required (positive number)" });
    return;
  }
  const ok = reserveStock(id, quantity);
  if (!ok) {
    res.status(400).json({ message: "Insufficient stock or product not found" });
    return;
  }
  const product = getProductById(id);
  res.json({ productId: id, quantity, newStock: product?.stock ?? 0 });
});

router.post("/products/:id/release-stock", (req: Request, res: Response) => {
  const id = req.params.id;
  const quantity = typeof req.body?.quantity === "number" ? req.body.quantity : undefined;
  if (quantity === undefined || quantity < 1) {
    res.status(400).json({ message: "quantity required (positive number)" });
    return;
  }
  const product = getProductById(id);
  if (!product) {
    res.status(404).json({ message: "Product not found" });
    return;
  }
  releaseStock(id, quantity);
  const updated = getProductById(id);
  res.json({ productId: id, quantity, newStock: updated?.stock ?? 0 });
});

router.delete("/products/:id", (req: Request, res: Response) => {
  const existing = getProductById(req.params.id);
  if (!existing) {
    res.status(404).json({ message: "Product not found" });
    return;
  }
  deleteProduct(req.params.id);
  res.status(204).send();
});

export default router;
