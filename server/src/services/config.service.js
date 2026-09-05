import prisma from "../config/prisma.js";

// Read-only aggregate of the discount-governance config, consumed by the
// quotation/approval risk engine and by the (not-yet-built) admin config
// screen. companyId-scoped like everything else.
export async function getDiscountLimits(companyId) {
  const [tiers, categoryLimits, approvalChainRules, warehouses, products] = await Promise.all([
    prisma.discountTier.findMany({ where: { companyId } }),
    prisma.categoryDiscountLimit.findMany({ where: { companyId } }),
    prisma.approvalChainRule.findMany({ where: { companyId }, orderBy: { priority: "asc" } }),
    prisma.warehouse.findMany({
      where: { companyId },
      include: {
        stockLevels: {
          include: { product: { select: { id: true, name: true, category: true, basePrice: true } } },
        },
      },
    }),
    prisma.product.findMany({
      where: { companyId },
      include: { variants: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { tiers, categoryLimits, approvalChainRules, warehouses, products };
}
