import prisma from "../config/prisma.js";

/**
 * Resolves which ApprovalStep rows need to be created for a given blendedRiskScore.
 *
 * @param {string} companyId
 * @param {number} blendedRiskScore
 * @returns {Promise<Array<{ approverRole: string, stepOrder: number }>>}
 *   Empty array = within limits, no approval needed.
 */
export async function resolveApprovalSteps(companyId, blendedRiskScore) {
  if (blendedRiskScore === 0) return [];

  // Find all matching rules ordered by priority (lower = evaluated first)
  const rules = await prisma.approvalChainRule.findMany({
    where: {
      companyId,
      minDiscountPercent: { lte: blendedRiskScore },
      maxDiscountPercent: { gte: blendedRiskScore },
    },
    orderBy: { priority: "asc" },
  });

  if (!rules.length) return [];

  // Merge across all matching rules: if ANY rule requires Finance, we need Finance.
  const requiresManager = rules.some((r) => r.requiresManager);
  const requiresFinance = rules.some((r) => r.requiresFinance);

  const steps = [];
  if (requiresManager) steps.push({ approverRole: "MANAGER", stepOrder: 1 });
  if (requiresFinance) steps.push({ approverRole: "FINANCE", stepOrder: 2 });

  return steps;
}
