import prisma from "../config/prisma.js";
import { httpError } from "../utils/httpError.js";
import { broadcast } from "../sockets/index.js";

// ─── List pending approvals for a rep/finance user ────────────────────────────

/**
 * Returns quotations that have a pending ApprovalStep matching the caller's role.
 * Only shows the NEXT unacted step per quotation (lowest stepOrder with status=PENDING).
 */
export async function listPendingApprovals(approverId, companyId, role) {
  // Find quotations with a PENDING step that matches this role
  const steps = await prisma.approvalStep.findMany({
    where: {
      quotation: { companyId },
      approverRole: role,
      status: "PENDING",
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
 */
export async function actOnApproval(approverId, companyId, quotationId, { action, reason }) {
  const quotation = await prisma.quotation.findFirst({
    where: { id: quotationId, companyId, status: "PENDING_APPROVAL" },
    include: {
      approvalSteps: { orderBy: { stepOrder: "asc" } },
    },
  });

  if (!quotation) throw httpError(404, "Quotation not found or not pending approval");

  // Find the current active step for this approver's role
  const currentStep = quotation.approvalSteps.find(
    (s) => s.status === "PENDING" && s.approverRole !== null
  );

  if (!currentStep) {
    throw httpError(409, "No pending approval step found for this quotation");
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

  // All steps done → CONFIRMED
  await prisma.quotation.update({
    where: { id: quotationId },
    data: { status: "CONFIRMED", lastActivityAt: now },
  });

  await prisma.auditLog.create({
    data: {
      companyId,
      userId: approverId,
      entityType: "Quotation",
      entityId: quotationId,
      action: "CONFIRMED",
      metadata: { confirmedViaApproval: true, finalApprover: approverId },
    },
  });

  broadcast(quotationId, {
    event: "QUOTATION_CONFIRMED",
    quotationId,
    confirmedBy: approverId,
    confirmedByType: "APPROVER",
  });

  return { quotationId, status: "CONFIRMED" };
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
      customer: true,
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

  return {
    id: quotation.id,
    status: quotation.status,
    blendedRiskScore: quotation.blendedRiskScore,
    customer: { id: quotation.customer.id, name: quotation.customer.name, tier: quotation.customer.tier },
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
