import { Router } from "express";
import { authenticate, requireInternal } from "../middleware/auth.middleware.js";
import { getQuotationReport } from "../controllers/report.controller.js";

const router = Router();

// GET /api/reports/quotations
router.get("/quotations", authenticate, requireInternal, getQuotationReport);

export default router;
