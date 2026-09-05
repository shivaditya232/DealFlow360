import prisma from "../config/prisma.js";

// Read-only aggregate of the discount-governance config, consumed by the
// quotation/approval risk engine and by the (not-yet-built) admin config
// screen. companyId-scoped like everything else.
export async function getDiscountLimits(companyId) {
  const [tiers, categoryLimits, approvalChainRules] = await Promise.all([
    prisma.discountTier.findMany({ where: { companyId } }),
    prisma.categoryDiscountLimit.findMany({ where: { companyId } }),
    prisma.approvalChainRule.findMany({ where: { companyId }, orderBy: { priority: "asc" } }),
  ]);
  return { tiers, categoryLimits, approvalChainRules };
}
