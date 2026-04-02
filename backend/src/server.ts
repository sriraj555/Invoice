import express from "express";
import cors from "cors";
import invoiceRoutes from "./routes";
import { env } from "./env";

<<<<<<< HEAD
export const app = express();
=======
const app = express();
>>>>>>> 939fbba14dc2753b1eaa48d3ee547d81e638fe50
app.use(cors());
app.use(express.json());
app.use("/", invoiceRoutes);
app.get("/health", (_req, res) => res.json({ status: "ok", service: "invoices" }));

<<<<<<< HEAD
if (!process.env.LAMBDA_TASK_ROOT) {
  app.listen(env.port, () => console.log(`Invoices service http://localhost:${env.port}`));
}
=======
app.listen(env.port, () => console.log(`Invoices service http://localhost:${env.port}`));
>>>>>>> 939fbba14dc2753b1eaa48d3ee547d81e638fe50
