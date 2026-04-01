import express from "express";
import cors from "cors";
import paymentRoutes from "./routes";
import { env } from "./env";

export const app = express();
app.use(cors());
app.use(express.json());
app.use("/", paymentRoutes);
app.get("/health", (_req, res) => res.json({ status: "ok", service: "payments" }));

if (!process.env.LAMBDA_TASK_ROOT) {
  app.listen(env.port, () => console.log(`Payments service http://localhost:${env.port}`));
}
