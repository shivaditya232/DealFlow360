import http from "http";
import express from "express";
import cors from "cors";
import config from "./config/index.js";
import prisma from "./config/prisma.js";
import redis from "./config/redis.js";
import authRoutes from "./routes/auth.routes.js";
import otpRoutes from "./routes/otp.routes.js";
import configRoutes from "./routes/config.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import quotationRoutes from "./routes/quotation.routes.js";
import approvalRoutes from "./routes/approval.routes.js";
import portalRoutes from "./routes/portal.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import productRoutes from "./routes/product.routes.js";
import stockRoutes from "./routes/stock.routes.js";
import reportRoutes from "./routes/report.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { initSocketIO } from "./sockets/index.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/otp", otpRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/config", configRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/portal", portalRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/reports", reportRoutes);

app.use(errorHandler);

// Socket.IO needs the raw http.Server (not the Express app) to attach to —
// approval.service.js, portal.service.js and proposalExpiry.service.js
// already call broadcast(quotationId, ...) throughout the negotiation and
// approval flows; without this, initSocketIO() is never called, io stays
// undefined, and every one of those broadcasts silently no-ops.
const httpServer = http.createServer(app);
initSocketIO(httpServer);

httpServer.listen(config.port, () => {
  console.log(`Server listening on port ${config.port} (HTTP + Socket.IO)`);
});

export default app;
