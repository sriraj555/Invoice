import express from "express";
import cors from "cors";
import invoiceRoutes from "./routes";
import { env } from "./env";

export const app = express();
app.use(cors());
app.use(express.json());
app.use("/", invoiceRoutes);
app.get("/health", (_req, res) => res.json({ status: "ok", service: "invoices" }));

if (!process.env.LAMBDA_TASK_ROOT) {
  app.listen(env.port, () => console.log(`Invoices service http://localhost:${env.port}`));
}
