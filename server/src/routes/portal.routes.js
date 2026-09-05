import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  listQuotations,
  getQuotation,
  acceptQuotation,
  confirmQuotation,
  createProposal,
  customerAcceptProposal,
  repRespondToProposal,
  getProfile,
  getOrders,
  getBilling,
} from "../controllers/portal.controller.js";

const router = Router();

// All portal routes require a valid JWT
router.use(authenticate);

// ── Profile ───────────────────────────────────────────────────────────────────
// GET /api/portal/profile  → name, email, tier, reliabilityScore, lastScoreChange
router.get("/profile", getProfile);

// ── Orders & Billing ──────────────────────────────────────────────────────────
// GET /api/portal/orders   → customer fulfillment splits (shipped vs backordered)
// GET /api/portal/billing  → one-time invoices and recurring subscriptions
router.get("/orders", getOrders);
router.get("/billing", getBilling);

// ── Dashboard: list quotations ────────────────────────────────────────────────
// GET /api/portal/quotations           → all visible quotations (sorted lastActivityAt desc)
// GET /api/portal/quotations?status=   → filtered by status tab
// GET /api/portal/quotations/:id       → single quotation with lines + current proposal
router.get("/quotations", listQuotations);
router.get("/quotations/:id", getQuotation);

// ── Customer: act on a quotation ─────────────────────────────────────────────
// POST /api/portal/quotations/:id/accept    → accept quote (legacy/alias, same as confirm)
// POST /api/portal/quotations/:id/confirm   → Confirm button on dashboard → CONFIRMED
// POST /api/portal/quotations/:id/proposals → Submit Request (message or negotiate)
router.post("/quotations/:id/accept", acceptQuotation);
router.post("/quotations/:id/confirm", confirmQuotation);
router.post("/quotations/:id/proposals", createProposal);

// ── Customer: accept a rep's counter-proposal ────────────────────────────────
// POST /api/portal/proposals/:proposalId/accept
router.post("/proposals/:proposalId/accept", customerAcceptProposal);

// ── Rep: respond to a customer proposal ──────────────────────────────────────
// POST /api/portal/proposals/:proposalId/respond  (ACCEPT | REJECT | COUNTER)
router.post("/proposals/:proposalId/respond", repRespondToProposal);

export default router;
