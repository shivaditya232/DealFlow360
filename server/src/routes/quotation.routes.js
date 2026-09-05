import { Router } from "express";
import { authenticate, requireInternal } from "../middleware/auth.middleware.js";
import * as quotationController from "../controllers/quotation.controller.js";

const router = Router();

router.use(authenticate);

router.post("/", requireInternal, quotationController.create);
router.get("/", requireInternal, quotationController.list);
router.get("/:id", quotationController.detail); // customer portal will also read its own quotation here later
router.post("/:id/lines", requireInternal, quotationController.addLine);
router.patch("/:id/lines/:lineId", requireInternal, quotationController.updateLine);
router.delete("/:id/lines/:lineId", requireInternal, quotationController.deleteLine);
router.get("/:id/upsell-suggestions", requireInternal, quotationController.upsellSuggestions);
router.post("/:id/submit", requireInternal, quotationController.submit);

// Negotiation/chat proposals live under the friend's portal module
// (POST/GET /api/portal/quotations/:id/proposals, /api/portal/proposals/:id/respond)
// — not duplicated here.

export default router;
