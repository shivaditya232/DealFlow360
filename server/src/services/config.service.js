import prisma from "../config/prisma.js";

// Aggregate of the discount-governance config, consumed by the
// quotation/approval risk engine and by the admin config screen.
// companyId-scoped like everything else.
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

// Admin-only (gated at the route level) — mockup screen 18's "Save
// configuration" button submits all three tables at once, so this mirrors
// that: one call replaces the whole config rather than exposing granular
// per-row CRUD. This is the config the rest of the app (riskCalculator.js,
// approvalRouter.js) was already reading — it just had no writer yet.
export async function updateDiscountLimits(companyId, { tiers, categoryLimits, approvalChainRules }) {
  await prisma.$transaction(async (tx) => {
    // Tiers are a fixed set (BRONZE/SILVER/GOLD) — upsert in place so a
    // partial submit never deletes a tier's ceiling out from under the risk
    // calculator (which treats a missing DiscountTier row as a 0% ceiling).
    for (const t of tiers) {
      await tx.discountTier.upsert({
        where: { companyId_tier: { companyId, tier: t.tier } },
        create: { companyId, tier: t.tier, maxDiscountPercent: t.maxDiscountPercent },
        update: { maxDiscountPercent: t.maxDiscountPercent },
      });
    }

    // Category limits and approval chain rules are admin-managed, open-ended
    // lists (add/remove rows in the UI) — replace-all matches the
    // "Save configuration" semantics and avoids reconciling stale rows.
    await tx.categoryDiscountLimit.deleteMany({ where: { companyId } });
    if (categoryLimits.length) {
      await tx.categoryDiscountLimit.createMany({
        data: categoryLimits.map((c) => ({
          companyId,
          category: c.category,
          maxDiscountPercent: c.maxDiscountPercent,
        })),
      });
    }

    await tx.approvalChainRule.deleteMany({ where: { companyId } });
    if (approvalChainRules.length) {
      await tx.approvalChainRule.createMany({
        data: approvalChainRules.map((r, idx) => ({
          companyId,
          minDiscountPercent: r.minDiscountPercent,
          maxDiscountPercent: r.maxDiscountPercent,
          requiresManager: r.requiresManager,
          requiresFinance: r.requiresFinance,
          priority: r.priority ?? idx,
        })),
      });
    }
  });

  return getDiscountLimits(companyId);
}
