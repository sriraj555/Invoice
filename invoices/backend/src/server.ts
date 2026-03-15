import express from "express";
import cors from "cors";
import invoiceRoutes from "./routes";
import { env } from "./env";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/", invoiceRoutes);
app.get("/health", (_req, res) => res.json({ status: "ok", service: "invoices" }));

app.listen(env.port, () => console.log(`Invoices service http://localhost:${env.port}`));
