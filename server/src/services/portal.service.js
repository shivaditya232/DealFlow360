import prisma from "../config/prisma.js";
import redis from "../config/redis.js";
import { httpError } from "../utils/httpError.js";
import { computeBlendedRiskScore, fetchCurrentLimits } from "../utils/riskCalculator.js";
import { resolveApprovalSteps } from "../utils/approvalRouter.js";
import { broadcast } from "../sockets/index.js";
import { triggerFulfillment, triggerBilling } from "./fulfillment.service.js";

const TTL_72H_SECONDS = 72 * 60 * 60;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function assertQuotationOwnership(quotation, customerId) {
  if (!quotation || quotation.customerId !== customerId) {
    throw httpError(403, "Quotation not found or access denied");
  }
}

function assertQuotationNegotiable(quotation) {
  const allowed = ["APPROVED", "NEGOTIATING"];
  if (!allowed.includes(quotation.status)) {
    throw httpError(409, `Quotation is not open for negotiation (status: ${quotation.status})`);
  }
}

// ─── Portal: view quotations ───────────────────────────────────────────────────

// Portal-visible statuses — what a customer can actually see
const PORTAL_VISIBLE_STATUSES = ["APPROVED", "NEGOTIATING", "CONFIRMED", "PENDING_APPROVAL"];

/**
 * Lists all quotations visible to a customer on the portal.
 * Supports optional ?status= filter for dashboard tabs.
 * Returns orderTotal and lineCount computed from lines.
 *
 * @param {string} customerId
 * @param {string} companyId
 * @param {string|undefined} statusFilter  - optional QuotationStatus value
 */
export async function listPortalQuotations(customerId, companyId, statusFilter) {
  const validFilter =
    statusFilter && PORTAL_VISIBLE_STATUSES.includes(statusFilter)
      ? statusFilter
      : undefined;

  const quotations = await prisma.quotation.findMany({
    where: {
      companyId,
      customerId,
      status: validFilter ? validFilter : { in: PORTAL_VISIBLE_STATUSES },
    },
    orderBy: { lastActivityAt: "desc" },
    select: {
      id: true,
      status: true,
      blendedRiskScore: true,
      createdAt: true,
      updatedAt: true,
      expiresAt: true,
      confirmationDeadline: true,
      lastActivityAt: true,
      lines: {
        select: {
          unitPrice: true,
          quantity: true,
          discountPercent: true,
        },
      },
    },
  });

  return quotations.map(({ lines, ...q }) => {
    const orderTotal = lines.reduce(
      (sum, l) =>
        sum + Number(l.unitPrice) * l.quantity * (1 - Number(l.discountPercent) / 100),
      0
    );
    return {
      ...q,
      lineCount: lines.length,
      orderTotal: Math.round(orderTotal * 100) / 100,
    };
  });
}

/**
 * Returns a single quotation with full line detail — only if it belongs to this customer.
 * Includes the single current PENDING proposal (if any) so the UI can show negotiation state.
 */
export async function getPortalQuotation(customerId, companyId, quotationId) {
  const quotation = await prisma.quotation.findFirst({
    where: { id: quotationId, companyId, customerId },
    include: {
      lines: {
        include: {
          product: { select: { name: true, category: true, unit: true } },
          variant: { select: { attributeName: true, attributeValue: true } },
        },
      },
      // Only the ONE current pending proposal — overwrite-in-place means at most one
      negotiationProposals: {
        where: { status: "PENDING" },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!quotation) throw httpError(403, "Quotation not found or access denied");

  // Compute line totals in application logic (not stored on the row)
  const lines = quotation.lines.map((l) => ({
    ...l,
    lineTotal: Number(l.unitPrice) * l.quantity * (1 - Number(l.discountPercent) / 100),
  }));

  const orderTotal = Math.round(
    lines.reduce((sum, l) => sum + l.lineTotal, 0) * 100
  ) / 100;

  // Flatten: currentProposal is null if nothing is PENDING
  const currentProposal = quotation.negotiationProposals[0] ?? null;

  // Activity feed — relevant AuditLog entries for this quotation, newest first.
  // Gives customers a persistent history even when they missed live WS events.
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      companyId,
      OR: [
        { entityId: quotationId },
        { entityType: "FulfillmentSplit", metadata: { path: ["quotationId"], equals: quotationId } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const activityFeed = auditLogs.map((log) => ({
    action: log.action,
    createdAt: log.createdAt,
    note: log.metadata?.reason ?? log.metadata?.note ?? null,
  }));

  return {
    ...quotation,
    negotiationProposals: undefined, // strip the array
    currentProposal,
    lines,
    orderTotal,
    lineCount: lines.length,
    activityFeed,
  };
}

// ─── Portal: profile ──────────────────────────────────────────────────────────

/**
 * Returns the customer's own profile info + reliability score + last score event.
 * Decision (locked): uses ScoreReason.label as-is (internal wording).
 * lastScoreChange is null if the customer has never had a score event.
 */
export async function getProfile(customerId, companyId) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId },
    select: {
      name: true,
      email: true,
      tier: true,
      reliabilityScore: true,
      scoreEvents: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          scoreReason: { select: { label: true } },
        },
      },
    },
  });

  if (!customer) throw httpError(404, "Customer not found");

  const lastEvent = customer.scoreEvents[0] ?? null;

  return {
    name: customer.name,
    email: customer.email,
    tier: customer.tier,
    reliabilityScore: customer.reliabilityScore,
    lastScoreChange: lastEvent
      ? {
          delta: lastEvent.delta,
          reason: lastEvent.scoreReason.label,
          createdAt: lastEvent.createdAt,
        }
      : null,
  };
}

// ─── Portal: accept quotation ──────────────────────────────────────────────────

/**
 * Customer accepts the quotation as-is → CONFIRMED.
 * Writes AuditLog + broadcasts to rep's workspace.
 */
export async function acceptQuotation(customerId, companyId, quotationId) {
  const quotation = await prisma.quotation.findFirst({
    where: { id: quotationId, companyId },
  });

  assertQuotationOwnership(quotation, customerId);
  assertQuotationNegotiable(quotation);

  // Guard: block confirmation while a PENDING proposal is still awaiting rep response.
  // Confirming while a counter-offer is in flight is ambiguous — which terms apply?
  const pendingProposal = await prisma.negotiationProposal.findFirst({
    where: { quotationId, status: "PENDING" },
    select: { id: true },
  });
  if (pendingProposal) {
    throw httpError(
      409,
      "Cannot confirm while a negotiation proposal is still pending a response. " +
        "Wait for the rep to accept, reject, or counter your proposal first."
    );
  }

  const now = new Date();

  await prisma.$transaction([
    prisma.quotation.update({
      where: { id: quotationId },
      data: { status: "CONFIRMED", lastActivityAt: now },
    }),
    prisma.auditLog.create({
      data: {
        companyId,
        entityType: "Quotation",
        entityId: quotationId,
        action: "CONFIRMED",
        metadata: { confirmedBy: customerId, confirmedByType: "CUSTOMER" },
      },
    }),
  ]);

  broadcast(quotationId, {
    event: "QUOTATION_CONFIRMED",
    quotationId,
    confirmedBy: customerId,
  });

  // Fire fulfillment + billing
  triggerFulfillment(companyId, quotationId).catch((e) =>
    console.error(`[fulfillment] quotation ${quotationId}:`, e.message)
  );
  triggerBilling(companyId, quotationId).catch((e) =>
    console.error(`[billing] quotation ${quotationId}:`, e.message)
  );

  return { quotationId, status: "CONFIRMED" };
}

// ─── Portal: customer creates/overwrites a proposal ───────────────────────────

/**
 * Creates (or overwrites if one already exists for this quotation) a NegotiationProposal.
 * The overwrite-in-place model means there is always at most ONE proposal row per quotation
 * in the PENDING state at a time.
 */
export async function createProposal(
  customerId,
  companyId,
  quotationId,
  { lineId, proposedChanges, message, requestedDeliveryDate }
) {
  const quotation = await prisma.quotation.findFirst({
    where: { id: quotationId, companyId },
    include: { customer: { select: { tier: true } } },
  });

  assertQuotationOwnership(quotation, customerId);
  assertQuotationNegotiable(quotation);

  // Snapshot current limits at this moment
  const snapshotLimits = proposedChanges
    ? await fetchCurrentLimits(companyId, quotation.customer.tier)
    : null;

  const expiresAt = new Date(Date.now() + TTL_72H_SECONDS * 1000);
  const now = new Date();

  // Overwrite-in-place applies ONLY while a proposal is still PENDING (the
  // customer editing their own not-yet-answered request). Once a proposal
  // has been ACCEPTED/REJECTED/EXPIRED it's history — a new proposal after
  // that must be a NEW row, or the negotiation thread (which reads every
  // NegotiationProposal for the quotation, see quotation.service.js) loses
  // every past round the moment the next one starts.
  const existingPending = await prisma.negotiationProposal.findFirst({
    where: { quotationId, status: "PENDING" },
  });

  let proposal;
  const proposalData = {
    quotationId,
    lineId: lineId ?? null,
    proposedByType: "CUSTOMER",
    proposedByUserId: null,
    proposedByCustomerId: customerId,
    proposedChanges: proposedChanges ?? null,
    snapshotLimits,
    message: message ?? null,
    requestedDeliveryDate: requestedDeliveryDate ? new Date(requestedDeliveryDate) : null,
    status: "PENDING",
    expiresAt,
    respondedAt: null,
  };

  if (existingPending) {
    proposal = await prisma.negotiationProposal.update({
      where: { id: existingPending.id },
      data: proposalData,
    });
  } else {
    proposal = await prisma.negotiationProposal.create({ data: proposalData });
  }

  // Update quotation to NEGOTIATING if not already
  await prisma.quotation.update({
    where: { id: quotationId },
    data: {
      status: quotation.status === "NEGOTIATING" ? "NEGOTIATING" : "NEGOTIATING",
      lastActivityAt: now,
    },
  });

  // Set Redis TTL key for auto-expiry — keyspace notification fires expireProposal()
  await redis.set(`proposal:expire:${proposal.id}`, "1", "EX", TTL_72H_SECONDS);

  broadcast(quotationId, {
    event: "PROPOSAL_CREATED",
    quotationId,
    proposal,
    proposedByType: "CUSTOMER",
  });

  return proposal;
}

// ─── Rep: respond to a pending proposal ───────────────────────────────────────

/**
 * Rep accepts, rejects, or counters a pending NegotiationProposal.
 */
export async function respondToProposal(
  repId,
  companyId,
  proposalId,
  { action, proposedChanges, message }
) {
  const proposal = await prisma.negotiationProposal.findUnique({
    where: { id: proposalId },
    include: { quotation: { include: { customer: { select: { tier: true } } } } },
  });

  if (!proposal || proposal.quotation.companyId !== companyId) {
    throw httpError(404, "Proposal not found");
  }
  if (proposal.status !== "PENDING") {
    throw httpError(409, `Proposal is already ${proposal.status}`);
  }

  const now = new Date();

  if (action === "REJECT") {
    await prisma.$transaction([
      prisma.negotiationProposal.update({
        where: { id: proposalId },
        data: { status: "REJECTED", respondedAt: now },
      }),
      prisma.auditLog.create({
        data: {
          companyId,
          userId: repId,
          entityType: "NegotiationProposal",
          entityId: proposalId,
          action: "REJECTED",
          metadata: { respondedBy: repId, respondedByType: "REP", message },
        },
      }),
    ]);
    await redis.del(`proposal:expire:${proposalId}`);
    broadcast(proposal.quotationId, {
      event: "PROPOSAL_REJECTED",
      quotationId: proposal.quotationId,
      proposalId,
      rejectedBy: repId,
    });
    return { proposalId, status: "REJECTED" };
  }

  if (action === "COUNTER") {
    const snapshotLimits = await fetchCurrentLimits(
      companyId,
      proposal.quotation.customer.tier
    );
    const expiresAt = new Date(Date.now() + TTL_72H_SECONDS * 1000);

    const updated = await prisma.negotiationProposal.update({
      where: { id: proposalId },
      data: {
        proposedByType: "REP",
        proposedByUserId: repId,
        proposedByCustomerId: null,
        proposedChanges: proposedChanges ?? null,
        snapshotLimits,
        message: message ?? null,
        status: "PENDING",
        expiresAt,
        respondedAt: null,
      },
    });

    // Reset Redis TTL key for the new 72h window
    await redis.set(`proposal:expire:${proposalId}`, "1", "EX", TTL_72H_SECONDS);

    await prisma.quotation.update({
      where: { id: proposal.quotationId },
      data: { lastActivityAt: now },
    });

    broadcast(proposal.quotationId, {
      event: "PROPOSAL_COUNTERED",
      quotationId: proposal.quotationId,
      proposal: updated,
      proposedByType: "REP",
    });

    return updated;
  }

  // action === "ACCEPT"
  return executeAcceptFlow(repId, "REP", companyId, proposal.quotationId, proposalId);
}

// ─── Customer: accept a rep-initiated counter ─────────────────────────────────

/**
 * Customer accepts a rep's counter-proposal.
 */
export async function customerAcceptProposal(customerId, companyId, proposalId) {
  const proposal = await prisma.negotiationProposal.findUnique({
    where: { id: proposalId },
    include: { quotation: true },
  });

  if (!proposal || proposal.quotation.companyId !== companyId) {
    throw httpError(404, "Proposal not found");
  }
  if (proposal.quotation.customerId !== customerId) {
    throw httpError(403, "Access denied");
  }
  if (proposal.status !== "PENDING") {
    throw httpError(409, `Proposal is already ${proposal.status}`);
  }
  if (proposal.proposedByType !== "REP") {
    throw httpError(409, "Only the receiving party can accept — this proposal was made by you");
  }

  return executeAcceptFlow(customerId, "CUSTOMER", companyId, proposal.quotationId, proposalId);
}

// ─── Core: atomic accept-flow ─────────────────────────────────────────────────

/**
 * Executes the full accept-flow inside a single Prisma transaction:
 * 1. Apply proposedChanges to QuotationLine (or order-level)
 * 2. Write AuditLog
 * 3. Recompute blendedRiskScore
 * 4. Route to approval or CONFIRMED
 * 5. Mark proposal ACCEPTED
 * 6. Broadcast updated state
 *
 * This is the highest-risk function — test the "exceeds limits → re-approval"
 * path explicitly, since a quotation can move backward from APPROVED to PENDING_APPROVAL.
 */
export async function executeAcceptFlow(actorId, actorType, companyId, quotationId, proposalId) {
  const [proposal, quotation] = await Promise.all([
    prisma.negotiationProposal.findUnique({
      where: { id: proposalId },
      include: {
        line: true,
        quotation: { include: { customer: { select: { tier: true } } } },
      },
    }),
    prisma.quotation.findUnique({ where: { id: quotationId } }),
  ]);

  if (!proposal || proposal.status !== "PENDING") {
    throw httpError(409, "Proposal is no longer pending");
  }

  const changes = proposal.proposedChanges ?? {};
  const now = new Date();

  // Capture old values for AuditLog before applying changes
  const oldValues = {};
  if (proposal.lineId && proposal.line) {
    if (changes.discountPercent !== undefined) oldValues.discountPercent = Number(proposal.line.discountPercent);
    if (changes.quantity !== undefined) oldValues.quantity = proposal.line.quantity;
  }

  // ── Atomic transaction ──────────────────────────────────────────────────────
  await prisma.$transaction(async (tx) => {
    // Step 1: Apply changes to QuotationLine
    if (proposal.lineId && Object.keys(changes).length > 0) {
      const lineUpdate = {};
      if (changes.discountPercent !== undefined) lineUpdate.discountPercent = changes.discountPercent;
      if (changes.quantity !== undefined) lineUpdate.quantity = changes.quantity;
      await tx.quotationLine.update({ where: { id: proposal.lineId }, data: lineUpdate });
    }

    // Step 2: AuditLog — old value → new value, who proposed, who accepted
    await tx.auditLog.create({
      data: {
        companyId,
        userId: actorType === "REP" ? actorId : null,
        entityType: "NegotiationProposal",
        entityId: proposalId,
        action: "ACCEPTED",
        metadata: {
          acceptedBy: actorId,
          acceptedByType: actorType,
          proposedBy: proposal.proposedByUserId ?? proposal.proposedByCustomerId,
          proposedByType: proposal.proposedByType,
          oldValues,
          newValues: changes,
          quotationId,
          lineId: proposal.lineId,
        },
      },
    });

    // Step 3 & 4: Recompute risk + route approval (must happen AFTER line update)
    const newScore = await computeBlendedRiskScore(
      companyId,
      quotationId,
      quotation.customer?.tier ?? "BRONZE"
    );

    const approvalSteps = await resolveApprovalSteps(companyId, newScore);

    let newStatus;
    if (approvalSteps.length === 0) {
      // Within limits → CONFIRMED (or stays NEGOTIATING if no final accept yet)
      newStatus = "CONFIRMED";
      // Delete any stale PENDING approval steps from prior routing
      await tx.approvalStep.deleteMany({
        where: { quotationId, status: "PENDING" },
      });
    } else {
      // Exceeds limits → back to PENDING_APPROVAL (even if was previously APPROVED)
      newStatus = "PENDING_APPROVAL";
      // Create new ApprovalStep rows per the matching chain
      await tx.approvalStep.createMany({
        data: approvalSteps.map((s) => ({
          quotationId,
          approverRole: s.approverRole,
          stepOrder: s.stepOrder,
          status: "PENDING",
        })),
      });
      await tx.auditLog.create({
        data: {
          companyId,
          entityType: "Quotation",
          entityId: quotationId,
          action: "RE_APPROVAL_TRIGGERED",
          metadata: {
            reason: "Negotiated terms exceed discount limits",
            newBlendedRiskScore: newScore,
            stepsCreated: approvalSteps,
          },
        },
      });
    }

    // Step 5: Update quotation status + blendedRiskScore
    await tx.quotation.update({
      where: { id: quotationId },
      data: {
        status: newStatus,
        blendedRiskScore: newScore,
        lastActivityAt: now,
      },
    });

    // Step 6: Mark proposal ACCEPTED
    await tx.negotiationProposal.update({
      where: { id: proposalId },
      data: { status: "ACCEPTED", respondedAt: now },
    });
  });

  // Remove Redis TTL key — proposal is no longer pending
  await redis.del(`proposal:expire:${proposalId}`);

  // Re-fetch updated quotation for broadcast payload
  const updatedQuotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    select: { status: true, blendedRiskScore: true },
  });

  broadcast(quotationId, {
    event: "PROPOSAL_ACCEPTED",
    quotationId,
    proposalId,
    newStatus: updatedQuotation.status,
    blendedRiskScore: updatedQuotation.blendedRiskScore,
    acceptedBy: actorId,
    acceptedByType: actorType,
  });

  // If the quotation landed on CONFIRMED, fire fulfillment + billing
  if (updatedQuotation.status === "CONFIRMED") {
    triggerFulfillment(companyId, quotationId).catch((e) =>
      console.error(`[fulfillment] quotation ${quotationId}:`, e.message)
    );
    triggerBilling(companyId, quotationId).catch((e) =>
      console.error(`[billing] quotation ${quotationId}:`, e.message)
    );
  }

  return {
    quotationId,
    proposalId,
    newStatus: updatedQuotation.status,
    blendedRiskScore: updatedQuotation.blendedRiskScore,
  };
}
