import prisma from "../config/prisma.js";

const OPEN_STATUSES = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "NEGOTIATING"];
const STALLED_DAYS = 7;

function describeActivity(log) {
  // Best-effort human label from {entityType, action, metadata}; other
  // modules (fulfillment, subscriptions, ...) will add their own once built.
  const meta = log.metadata || {};
  switch (`${log.entityType}:${log.action}`) {
    case "Quotation:CREATED":
      return `New quotation ${log.entityId} created`;
    case "Quotation:SUBMITTED":
      return `Quotation ${log.entityId} submitted for approval`;
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
    default:
      return `${log.entityType} ${log.entityId}: ${log.action.toLowerCase()}`;
  }
}

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
