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

  // Fetch every rule configured for this company — not just the ones whose
  // [min,max] band contains the score — so a score above the highest
  // configured band can still be recognized as "worse than anything we have
  // a rule for" instead of just vanishing (see fail-safe branch below).
  const allRules = await prisma.approvalChainRule.findMany({
    where: { companyId },
    orderBy: { priority: "asc" },
  });

  if (!allRules.length) return [];

  const matchingRules = allRules.filter(
    (r) => Number(r.minDiscountPercent) <= blendedRiskScore && Number(r.maxDiscountPercent) >= blendedRiskScore
  );

  let effectiveRules = matchingRules;

  if (matchingRules.length === 0) {
    // Bug fix: a blendedRiskScore that exceeds EVERY configured rule's
    // maxDiscountPercent (e.g. only a 10–30 "Manager" band is configured and
    // a negotiated/entered discount produces a score of 34+, which is exactly
    // what a ~49% discount against a stricter category limit can produce)
    // used to fall through here with zero matching rules and silently
    // auto-approve — the worse the violation, the LESS scrutiny it got,
    // which is backwards for a platform whose whole premise is self-governing
    // discount control. A gap above the highest band must fail safe to the
    // strictest configured rule(s), never to "no approval needed". A score
    // below the lowest configured minDiscountPercent is the only case that
    // genuinely means "within limits" and skips approval.
    const highestConfiguredMax = Math.max(...allRules.map((r) => Number(r.maxDiscountPercent)));
    if (blendedRiskScore > highestConfiguredMax) {
      effectiveRules = allRules;
    } else {
      return [];
    }
  }

  // Merge across all matching (or, in the fail-safe case, all configured) rules:
  // if ANY rule requires Finance, we need Finance.
  const requiresManager = effectiveRules.some((r) => r.requiresManager);
  const requiresFinance = effectiveRules.some((r) => r.requiresFinance);

  const steps = [];
  if (requiresManager) steps.push({ approverRole: "MANAGER", stepOrder: 1 });
  if (requiresFinance) steps.push({ approverRole: "FINANCE", stepOrder: 2 });

  return steps;
}
