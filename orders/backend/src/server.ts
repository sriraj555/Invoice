import express from "express";
import cors from "cors";
import orderRoutes from "./routes";
import { env } from "./env";

export const app = express();
app.use(cors());
app.use(express.json());
app.use("/", orderRoutes);
app.get("/health", (_req, res) => res.json({ status: "ok", service: "orders" }));

if (!process.env.LAMBDA_TASK_ROOT) {
  app.listen(env.port, () => console.log(`Orders service http://localhost:${env.port}`));
}
