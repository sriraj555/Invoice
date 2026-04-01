import express from "express";
import cors from "cors";
import cartRoutes from "./routes";
import { env } from "./env";

export const app = express();
app.use(cors());
app.use(express.json());
app.use("/", cartRoutes);
app.get("/health", (_req, res) => res.json({ status: "ok", service: "carts" }));

if (!process.env.LAMBDA_TASK_ROOT) {
  app.listen(env.port, () => console.log(`Carts service http://localhost:${env.port}`));
}
