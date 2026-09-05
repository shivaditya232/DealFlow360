import express from "express";
import cors from "cors";
import config from "./config/index.js";
import prisma from "./config/prisma.js";
import redis from "./config/redis.js";
import authRoutes from "./routes/auth.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
});

export default app;
