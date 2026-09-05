import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import * as configController from "../controllers/config.controller.js";

const router = Router();

// Read: any authenticated internal user (the risk calculator's frontend
// counterparts — Quotation Builder's live limit check — need this too).
router.get("/discount-limits", authenticate, configController.getDiscountLimits);

// Write: Admin only (PS: "Admin: manages backend setup — discount tiers,
// approval chains").
router.put("/discount-limits", authenticate, authorize("ADMIN"), configController.updateDiscountLimits);

export default router;
