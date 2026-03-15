import express from "express";
import cors from "cors";
import orderRoutes from "./routes";
import { env } from "./env";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/", orderRoutes);
app.get("/health", (_req, res) => res.json({ status: "ok", service: "orders" }));

app.listen(env.port, () => console.log(`Orders service http://localhost:${env.port}`));
