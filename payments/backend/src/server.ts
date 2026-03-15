import express from "express";
import cors from "cors";
import paymentRoutes from "./routes";
import { env } from "./env";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/", paymentRoutes);
app.get("/health", (_req, res) => res.json({ status: "ok", service: "payments" }));

app.listen(env.port, () => console.log(`Payments service http://localhost:${env.port}`));
