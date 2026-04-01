import express from "express";
import cors from "cors";
import productRoutes from "./routes";
import { env } from "./env";

export const app = express();
app.use(cors());
app.use(express.json());
app.use("/", productRoutes);
app.get("/health", (_req, res) => res.json({ status: "ok", service: "products" }));

if (!process.env.LAMBDA_TASK_ROOT) {
  app.listen(env.port, () => console.log(`Products service http://localhost:${env.port}`));
}
