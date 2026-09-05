import { Router } from "express";
import { authenticate, requireInternal } from "../middleware/auth.middleware.js";
import * as dashboardController from "../controllers/dashboard.controller.js";

const router = Router();

// All dashboard routes require a valid internal-user JWT
router.use(authenticate, requireInternal);

// GET /api/dashboard/           — general stats + recent activity
router.get("/", dashboardController.getDashboard);

// GET /api/dashboard/stalled-deals   — open deals with no activity in 7+ days
router.get("/stalled-deals", dashboardController.getStalledDeals);

// GET /api/dashboard/anomalies        — quotations with unusually high discounts
router.get("/anomalies", dashboardController.getAnomalies);

// GET /api/dashboard/delivery-slippage — fulfilled quotations delivered after promised date
router.get("/delivery-slippage", dashboardController.getDeliverySlippage);

// POST /api/dashboard/escalate/:quotationId — flag & notify rep
router.post("/escalate/:quotationId", dashboardController.escalate);

export default router;
