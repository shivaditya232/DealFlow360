import prisma from "../config/prisma.js";
import { logAction } from "./audit.service.js";
import { broadcast } from "../sockets/index.js";

const OPEN_STATUSES = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "NEGOTIATING"];
const STALLED_DAYS = 7;
const ANOMALY_MIN_QUOTATIONS = 5;
const ANOMALY_THRESHOLD_POINTS = 5;

function describeActivity(log) {
  // Best-effort human label from {entityType, action, metadata}; other
  // modules (fulfillment, subscriptions, ...) will add their own once built.
  const meta = log.metadata || {};
  switch (`${log.entityType}:${log.action}`) {
    case "Quotation:CREATED":
      return `New quotation ${log.entityId} created`;
    case "Quotation:SUBMITTED":
      return `Quotation ${log.entityId} submitted for approval`;
    case "Quotation:CONFIRMED":
      return `Quotation ${log.entityId} confirmed`;
    case "Quotation:FULFILLED":
      return `Quotation ${log.entityId} fully fulfilled`;
    case "Quotation:BACKORDER_CREATED":
      return `Backorder created on quotation ${log.entityId}`;
    case "Quotation:ESCALATED":
      return `Quotation ${log.entityId} escalated`;
    case "ApprovalStep:APPROVED":
      return `Quotation ${meta.quotationId ?? log.entityId} approved by ${log.user?.name ?? "a reviewer"}`;
    case "ApprovalStep:REJECTED":
      return `Quotation ${meta.quotationId ?? log.entityId} rejected`;
    case "ApprovalStep:RETURNED":
      return `Quotation ${meta.quotationId ?? log.entityId} returned for revision`;
    case "NegotiationProposal:ACCEPTED":
      return `Negotiation change accepted on quotation ${meta.quotationId ?? log.entityId}`;
    case "NegotiationProposal:REJECTED":
      return `Negotiation change rejected on quotation ${meta.quotationId ?? log.entityId}`;
    case "FulfillmentSplit:BACKORDER_FULFILLED":
      return `Backorder fulfilled on quotation ${meta.quotationId ?? log.entityId}`;
    default:
      return `${log.entityType} ${log.entityId}: ${log.action.toLowerCase()}`;
  }
}

// ── General dashboard ──────────────────────────────────────────────────────────

export async function getDashboard(companyId) {
  const stalledSince = new Date(Date.now() - STALLED_DAYS * 24 * 60 * 60 * 1000);

  const [pendingApprovals, openQuotations, atRiskDeals, recentLogs] = await Promise.all([
    prisma.quotation.count({ where: { companyId, status: "PENDING_APPROVAL" } }),
    prisma.quotation.count({ where: { companyId, status: { in: OPEN_STATUSES } } }),
    prisma.quotation.count({
      where: { companyId, status: { in: OPEN_STATUSES }, lastActivityAt: { lt: stalledSince } },
    }),
    prisma.auditLog.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true } } },
    }),
  ]);

  return {
    stats: {
      pendingApprovals,
      openQuotations,
      atRiskDeals,
    },
    recentActivity: recentLogs.map((log) => ({
      id: log.id,
      text: describeActivity(log),
      createdAt: log.createdAt,
    })),
  };
}

// ── Stalled Deals ─────────────────────────────────────────────────────────────

/**
 * Returns open quotations with no activity in the last 7 days.
 * Manager/Finance/Admin see all reps; SALES_REP sees only own.
 */
export async function getStalledDeals(companyId, role, userId) {
  const stalledSince = new Date(Date.now() - STALLED_DAYS * 24 * 60 * 60 * 1000);
  const repFilter = role === "SALES_REP" ? { repId: userId } : {};

  const quotations = await prisma.quotation.findMany({
    where: {
      companyId,
      ...repFilter,
      status: { in: OPEN_STATUSES },
      lastActivityAt: { lt: stalledSince },
    },
    include: {
      customer: { select: { name: true } },
      rep: { select: { name: true } },
    },
    orderBy: { lastActivityAt: "asc" },
  });

  return quotations.map((q) => ({
    quotationId: q.id,
    customerName: q.customer.name,
    repName: q.rep.name,
    status: q.status,
    lastActivityAt: q.lastActivityAt,
    daysSinceActivity: Math.floor(
      (Date.now() - new Date(q.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24)
    ),
  }));
}

// ── Discount Anomalies ────────────────────────────────────────────────────────

/**
 * Flags open quotations whose overall discount is more than 5pp above the rep's
 * personal average (computed from their last 5+ CONFIRMED/FULFILLED quotations).
 * Same role scoping as stalled deals.
 */
export async function getAnomalies(companyId, role, userId) {
  const openStatuses = ["DRAFT", "PENDING_APPROVAL", "NEGOTIATING"];
  const repFilter = role === "SALES_REP" ? { repId: userId } : {};

  // Fetch all open quotations with lines
  const openQuotations = await prisma.quotation.findMany({
    where: { companyId, ...repFilter, status: { in: openStatuses } },
    include: {
      lines: { select: { quantity: true, unitPrice: true, discountPercent: true } },
      rep: { select: { id: true, name: true } },
      customer: { select: { name: true } },
    },
  });

  // Build per-rep historical averages from last 5+ confirmed/fulfilled quotations
  const repIds = [...new Set(openQuotations.map((q) => q.repId))];
  const repAverages = new Map();

  for (const repId of repIds) {
    const historicalQuotations = await prisma.quotation.findMany({
      where: {
        companyId,
        repId,
        status: { in: ["CONFIRMED", "FULFILLED"] },
      },
      include: { lines: { select: { quantity: true, unitPrice: true, discountPercent: true } } },
      orderBy: { updatedAt: "desc" },
      take: ANOMALY_MIN_QUOTATIONS * 2, // take more for a stable average
    });

    if (historicalQuotations.length < ANOMALY_MIN_QUOTATIONS) continue;

    // Overall discount = weighted average discount across all lines of each quotation
    const quotationDiscounts = historicalQuotations.map((q) => {
      const grossTotal = q.lines.reduce(
        (s, l) => s + Number(l.quantity) * Number(l.unitPrice),
        0
      );
      const netTotal = q.lines.reduce(
        (s, l) =>
          s + Number(l.quantity) * Number(l.unitPrice) * (1 - Number(l.discountPercent) / 100),
        0
      );
      return grossTotal > 0 ? ((grossTotal - netTotal) / grossTotal) * 100 : 0;
    });

    const avg =
      quotationDiscounts.reduce((s, d) => s + d, 0) / quotationDiscounts.length;
    repAverages.set(repId, avg);
  }

  // Flag quotations that exceed the rep's avg + threshold
  const flagged = [];
  for (const q of openQuotations) {
    const repAvg = repAverages.get(q.repId);
    if (repAvg === undefined) continue; // rep has < 5 historical quotations

    const grossTotal = q.lines.reduce(
      (s, l) => s + Number(l.quantity) * Number(l.unitPrice),
      0
    );
    const netTotal = q.lines.reduce(
      (s, l) =>
        s + Number(l.quantity) * Number(l.unitPrice) * (1 - Number(l.discountPercent) / 100),
      0
    );
    const overallDiscount =
      grossTotal > 0 ? ((grossTotal - netTotal) / grossTotal) * 100 : 0;

    if (overallDiscount > repAvg + ANOMALY_THRESHOLD_POINTS) {
      flagged.push({
        quotationId: q.id,
        customerName: q.customer.name,
        repName: q.rep.name,
        repId: q.repId,
        status: q.status,
        overallDiscountPercent: Math.round(overallDiscount * 100) / 100,
        repAvgDiscountPercent: Math.round(repAvg * 100) / 100,
        excessPoints: Math.round((overallDiscount - repAvg) * 100) / 100,
      });
    }
  }

  return flagged;
}

// ── Delivery Slippage ─────────────────────────────────────────────────────────

/**
 * Returns FULFILLED quotations where actual fulfillment date is later than
 * promisedDeliveryDate. Reads fulfilledAt from the FULFILLED AuditLog entry.
 */
export async function getDeliverySlippage(companyId, role, userId) {
  const repFilter = role === "SALES_REP" ? { repId: userId } : {};

  const quotations = await prisma.quotation.findMany({
    where: {
      companyId,
      ...repFilter,
      status: "FULFILLED",
      promisedDeliveryDate: { not: null },
    },
    include: {
      customer: { select: { name: true } },
      rep: { select: { name: true } },
    },
  });

  // Fetch FULFILLED audit log entry for each quotation to get actual fulfillment date
  const slipped = [];
  for (const q of quotations) {
    const fulfilledLog = await prisma.auditLog.findFirst({
      where: { companyId, entityType: "Quotation", entityId: q.id, action: "FULFILLED" },
      orderBy: { createdAt: "desc" },
    });

    // Fallback to lastActivityAt if no FULFILLED audit log (should always exist, just in case)
    const actualFulfilledAt = fulfilledLog?.createdAt ?? q.lastActivityAt;

    if (actualFulfilledAt > q.promisedDeliveryDate) {
      const daysLate = Math.ceil(
        (new Date(actualFulfilledAt).getTime() - new Date(q.promisedDeliveryDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      slipped.push({
        quotationId: q.id,
        customerName: q.customer.name,
        repName: q.rep.name,
        promisedDeliveryDate: q.promisedDeliveryDate,
        actualFulfilledAt,
        daysLate,
      });
    }
  }

  return slipped.sort((a, b) => b.daysLate - a.daysLate);
}

// ── Escalation ────────────────────────────────────────────────────────────────

/**
 * Logs an ESCALATED action on a quotation and broadcasts a WS notification
 * to the assigned rep. Minimal — no separate escalation table needed.
 */
export async function escalate(companyId, userId, quotationId) {
  const quotation = await prisma.quotation.findFirst({
    where: { id: quotationId, companyId },
    select: { id: true, repId: true },
  });
  if (!quotation) {
    const { httpError } = await import("../utils/httpError.js");
    throw httpError(404, "Quotation not found");
  }

  await logAction({
    companyId,
    userId,
    entityType: "Quotation",
    entityId: quotationId,
    action: "ESCALATED",
    metadata: { escalatedBy: userId },
  });

  broadcast(quotationId, {
    event: "QUOTATION_ESCALATED",
    quotationId,
    escalatedBy: userId,
    assignedRepId: quotation.repId,
  });

  return { quotationId, escalated: true };
}
