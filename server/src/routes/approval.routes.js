import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { listPendingApprovals, actOnApproval, getApprovalDetail } from "../controllers/approval.controller.js";

const router = Router();

// All approval routes: must be authenticated AND hold a Manager or Finance role
router.use(authenticate, authorize("MANAGER", "FINANCE", "ADMIN"));

// GET  /api/approvals          → list pending approval steps for my role
// POST /api/approvals/:quotationId/act  → approve / reject / return
router.get("/", listPendingApprovals);
router.get("/:quotationId/detail", getApprovalDetail);
router.post("/:quotationId/act", actOnApproval);

export default router;
