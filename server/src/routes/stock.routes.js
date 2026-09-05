import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { addStockHandler } from "../controllers/stock.controller.js";

const router = Router();

// POST /api/stock/add — Admin only
router.post("/add", authenticate, authorize("ADMIN"), addStockHandler);

export default router;
