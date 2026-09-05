import prisma from "../config/prisma.js";
import { broadcast } from "../sockets/index.js";

/**
 * Called by the Redis keyspace expiry listener when a proposal:expire:<id> key
 * fires. Auto-rejects the proposal and notifies both parties.
 *
 * This is best-effort fire-and-forget — if the proposal was already responded
 * to, it exits silently.
 */
export async function expireProposal(proposalId) {
  const proposal = await prisma.negotiationProposal.findUnique({
    where: { id: proposalId },
    include: { quotation: { select: { companyId: true } } },
  });

  if (!proposal || proposal.status !== "PENDING") return; // already handled

  const now = new Date();
  const companyId = proposal.quotation.companyId;

  await prisma.$transaction([
    prisma.negotiationProposal.update({
      where: { id: proposalId },
      data: { status: "REJECTED", respondedAt: now },
    }),
    prisma.auditLog.create({
      data: {
        companyId,
        entityType: "NegotiationProposal",
        entityId: proposalId,
        action: "EXPIRED",
        metadata: {
          actor: "SYSTEM:PROPOSAL_EXPIRY",
          quotationId: proposal.quotationId,
        },
      },
    }),
  ]);

  broadcast(proposal.quotationId, {
    event: "PROPOSAL_EXPIRED",
    proposalId,
    quotationId: proposal.quotationId,
  });
}
