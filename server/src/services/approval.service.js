import prisma from "../config/prisma.js";
import { httpError } from "../utils/httpError.js";
import { broadcast } from "../sockets/index.js";

// ─── List pending approvals for a rep/finance user ────────────────────────────

/**
 * Returns quotations that have a pending ApprovalStep matching the caller's role.
 * Only shows the NEXT unacted step per quotation (lowest stepOrder with status=PENDING).
 *
 * Bug fix: approval.routes.js authorizes MANAGER, FINANCE, *and* ADMIN to hit
 * these endpoints, but this query used to filter strictly by
 * `approverRole: role` — since ApprovalStep.approverRole is only ever
 * "MANAGER" or "FINANCE" (see approvalRouter.js), an ADMIN account could never
 * see anything here even though the route let them in and actOnApproval below
 * never checked the role either. An ADMIN is meant to be able to act on any
 * pending step (that's the whole point of granting them route access), so for
 * ADMIN we drop the approverRole filter and show every pending step company-wide.
 */
export async function listPendingApprovals(approverId, companyId, role) {
  const roleFilter = role === "ADMIN" ? {} : { approverRole: role };

  // Find quotations with a PENDING step that matches this role (or, for
  // ADMIN, any pending step at all — see comment above).
  const steps = await prisma.approvalStep.findMany({
    where: {
      quotation: { companyId },
      status: "PENDING",
      ...roleFilter,
    },
    include: {
      quotation: {
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              tier: true,
              reliabilityScore: true, // display-only for reviewer context
            },
          },
          rep: { select: { id: true, name: true } },
          lines: {
            include: { product: { select: { name: true, category: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return steps;
}

// ─── Act on a pending approval ────────────────────────────────────────────────

/**
 * APPROVE / REJECT / RETURN a quotation's current pending ApprovalStep.
 *
 * APPROVE: marks step done, advances chain or confirms quotation.
 * REJECT:  closes quotation as REJECTED, notifies all watchers.
 * RETURN:  moves quotation back to NEGOTIATING for rep to revise.
 *
 * Bug fix: this used to find the current pending step and act on it with no
 * check at all that the CALLER's own role matched that step's approverRole.
 * approval.routes.js authorizes MANAGER, FINANCE and ADMIN onto this endpoint
 * as a group, so on a high-discount quotation with both a Manager step and a
 * Finance step queued, a MANAGER could hit this route and approve/reject the
 * Finance step too (and vice versa) — the two supposedly separate sign-offs
 * were both reachable by either role. Same ADMIN carve-out as
 * listPendingApprovals above: ADMIN can act on any pending step regardless
 * of its approverRole, everyone else is locked to their own role's step.
 */
export async function actOnApproval(approverId, companyId, role, quotationId, { action, reason }) {
  const quotation = await prisma.quotation.findFirst({
    where: { id: quotationId, companyId, status: "PENDING_APPROVAL" },
    include: {
      approvalSteps: { orderBy: { stepOrder: "asc" } },
    },
  });

  if (!quotation) throw httpError(404, "Quotation not found or not pending approval");

  // Find the current active step (lowest-order PENDING step in the chain)
  const currentStep = quotation.approvalSteps.find(
    (s) => s.status === "PENDING" && s.approverRole !== null
  );

  if (!currentStep) {
    throw httpError(409, "No pending approval step found for this quotation");
  }

  // Lock the step to its own approverRole — ADMIN is the only role allowed
  // to act across roles.
  if (role !== "ADMIN" && currentStep.approverRole !== role) {
    throw httpError(403, `This step needs ${currentStep.approverRole} approval — not yours to act on`);
  }

  const now = new Date();

  if (action === "REJECT") {
    await prisma.$transaction([
      prisma.approvalStep.update({
        where: { id: currentStep.id },
        data: { status: "REJECTED", approverId, actedAt: now, reason },
      }),
      prisma.quotation.update({
        where: { id: quotationId },
        data: { status: "REJECTED", lastActivityAt: now },
      }),
      prisma.auditLog.create({
        data: {
          companyId,
          userId: approverId,
          entityType: "ApprovalStep",
          entityId: currentStep.id,
          action: "REJECTED",
          metadata: { reason, quotationId, approverRole: currentStep.approverRole },
        },
      }),
    ]);

    broadcast(quotationId, {
      event: "QUOTATION_REJECTED",
      quotationId,
      rejectedBy: approverId,
      reason,
    });

    return { quotationId, status: "REJECTED" };
  }

  if (action === "RETURN") {
    await prisma.$transaction([
      prisma.approvalStep.update({
        where: { id: currentStep.id },
        data: { status: "RETURNED", approverId, actedAt: now, reason },
      }),
      prisma.quotation.update({
        where: { id: quotationId },
        data: { status: "NEGOTIATING", lastActivityAt: now },
      }),
      prisma.auditLog.create({
        data: {
          companyId,
          userId: approverId,
          entityType: "ApprovalStep",
          entityId: currentStep.id,
          action: "RETURNED",
          metadata: { reason, quotationId, approverRole: currentStep.approverRole },
        },
      }),
    ]);

    broadcast(quotationId, {
      event: "QUOTATION_RETURNED_FOR_REVISION",
      quotationId,
      returnedBy: approverId,
      reason,
    });

    return { quotationId, status: "NEGOTIATING" };
  }

  // action === "APPROVE"
  await prisma.approvalStep.update({
    where: { id: currentStep.id },
    data: { status: "APPROVED", approverId, actedAt: now },
  });

  await prisma.auditLog.create({
    data: {
      companyId,
      userId: approverId,
      entityType: "ApprovalStep",
      entityId: currentStep.id,
      action: "APPROVED",
      metadata: { quotationId, approverRole: currentStep.approverRole },
    },
  });

  // Check if there is a next step pending (e.g. Finance after Manager)
  const nextStep = quotation.approvalSteps.find(
    (s) => s.stepOrder > currentStep.stepOrder && s.status === "PENDING"
  );

  if (nextStep) {
    // Chain continues — quotation stays PENDING_APPROVAL, next approver takes over
    await prisma.quotation.update({
      where: { id: quotationId },
      data: { lastActivityAt: now },
    });

    broadcast(quotationId, {
      event: "APPROVAL_STEP_APPROVED",
      quotationId,
      approvedStep: currentStep.approverRole,
      nextStep: nextStep.approverRole,
    });

    return { quotationId, status: "PENDING_APPROVAL", nextStep: nextStep.approverRole };
  }

  // All internal approval steps done → APPROVED, not CONFIRMED.
  //
  // Bug fix: this used to jump straight to CONFIRMED here, which finalized
  // the deal on the company's internal say-so alone and skipped the customer
  // entirely — a quotation that needed Manager/Finance sign-off would clear
  // approval and land in the portal already CONFIRMED, so the customer could
  // never negotiate or even explicitly accept it (assertQuotationNegotiable
  // only allows APPROVED/NEGOTIATING; CONFIRMED is read-only on purpose).
  // A quotation that DIDN'T need approval already goes to APPROVED (see the
  // steps.length === 0 branch in quotation.service.js), which the customer
  // can then negotiate or accept via acceptQuotation/confirmQuotation in
  // portal.service.js. This makes the two paths consistent: internal
  // approval opens the door, only the customer's own acceptance confirms it.
  await prisma.quotation.update({
    where: { id: quotationId },
    data: { status: "APPROVED", lastActivityAt: now },
  });

  await prisma.auditLog.create({
    data: {
      companyId,
      userId: approverId,
      entityType: "Quotation",
      entityId: quotationId,
      action: "APPROVED",
      metadata: { approvedViaChain: true, finalApprover: approverId },
    },
  });

  broadcast(quotationId, {
    event: "QUOTATION_APPROVED",
    quotationId,
    approvedBy: approverId,
  });

  // NOTE: fulfillment/billing are NOT fired here. main's version used to fire
  // them at this point and return status "CONFIRMED", but this session's bug
  // fix changed final-step approval to land on "APPROVED" (not "CONFIRMED") so
  // the customer still gets to negotiate/accept in the portal — see the long
  // comment above this block. Fulfillment/billing now only fire once the
  // quotation actually reaches CONFIRMED, which happens via the customer's own
  // acceptance in portal.service.js (acceptQuotation / executeAcceptFlow),
  // where the merged-in triggerFulfillment/triggerBilling calls already live.
  return { quotationId, status: "APPROVED" };
}

// ─── Detail view for the Approval Detail screen ────────────────────────────
// Added on top of the friend's approve/reject/return logic above — read-only,
// doesn't touch anything else in this file. Full step history + audit trail
// for one quotation (listPendingApprovals only returns steps pending for the
// CALLER's role, not the whole chain, so that alone can't render Screen 6).
export async function getApprovalDetail(companyId, quotationId) {
  const quotation = await prisma.quotation.findFirst({
    where: { id: quotationId, companyId },
    include: {
      customer: {
        include: {
          scoreEvents: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { scoreReason: { select: { label: true } } },
          },
        },
      },
      lines: { include: { product: true } },
      approvalSteps: { include: { approver: { select: { name: true } } }, orderBy: { stepOrder: "asc" } },
    },
  });
  if (!quotation) throw httpError(404, "Quotation not found");

  const auditTrail = await prisma.auditLog.findMany({
    where: { companyId, entityId: quotationId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
  // ApprovalStep audit rows are logged with entityId = the step id, not the
  // quotation id (see actOnApproval above) — pull those in too via metadata.
  const stepAudit = await prisma.auditLog.findMany({
    where: { companyId, entityType: "ApprovalStep", metadata: { path: ["quotationId"], equals: quotationId } },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
  const combinedAudit = [...auditTrail, ...stepAudit].sort((a, b) => a.createdAt - b.createdAt);

  const lastScoreEvent = quotation.customer.scoreEvents?.[0];

  return {
    id: quotation.id,
    status: quotation.status,
    blendedRiskScore: quotation.blendedRiskScore,
    customer: {
      id: quotation.customer.id,
      name: quotation.customer.name,
      tier: quotation.customer.tier,
      reliabilityScore: quotation.customer.reliabilityScore,
      latestScoreReason: lastScoreEvent?.scoreReason?.label ?? lastScoreEvent?.note ?? "No recent score changes",
    },
    lines: quotation.lines.map((line) => ({
      id: line.id,
      productName: line.product.name,
      category: line.product.category,
      discountPercent: Number(line.discountPercent),
      limit: Math.min(Number(line.categoryLimitAtTime), Number(line.tierLimitAtTime)),
      overagePoints: Math.max(
        0,
        Number(line.discountPercent) - Math.min(Number(line.categoryLimitAtTime), Number(line.tierLimitAtTime))
      ),
    })),
    approvalSteps: quotation.approvalSteps.map((s) => ({
      id: s.id,
      approverRole: s.approverRole,
      status: s.status,
      approver: s.approver?.name ?? null,
      actedAt: s.actedAt,
      reason: s.reason,
      stepOrder: s.stepOrder,
    })),
    auditTrail: combinedAudit.map((a) => ({
      user: a.user?.name ?? "System",
      action: a.action,
      date: a.createdAt,
      note: a.metadata?.reason ?? null,
    })),
  };
}
