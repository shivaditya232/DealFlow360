import prisma from "../config/prisma.js";

/**
 * Computes the blended risk score for a quotation.
 *
 * Formula (finalized):
 *   blendedRiskScore = SUM( MAX(0, askedDiscount% - effectiveLimit%) ) across all lines
 *   where effectiveLimit = min(tierLimit%, categoryLimit%)
 *
 * Only lines exceeding their effective limit contribute — compliant lines
 * contribute exactly 0 and must NEVER produce a negative offset that masks violations.
 *
 * @param {string} companyId
 * @param {string} quotationId
 * @param {string} customerTier  - CustomerTier enum value ("BRONZE" | "SILVER" | "GOLD")
 * @param {object} [db=prisma]  - Prisma client to query with. Bug fix: when this
 *   is called from inside a prisma.$transaction(async (tx) => ...) callback
 *   RIGHT AFTER updating a QuotationLine's discountPercent within that same
 *   transaction, querying with the module-level `prisma` singleton (a
 *   different connection under READ COMMITTED isolation) reads the PRE-update
 *   row — the transaction hasn't committed yet. That let a negotiated
 *   discount blow past its approval threshold (e.g. accepting a 49% discount
 *   proposal) get silently auto-confirmed, because the score was computed
 *   from the OLD discount, not the one just being applied. Callers inside a
 *   transaction must pass their `tx` client here so the read sees the write.
 * @returns {Promise<number>} blendedRiskScore (2 decimal places)
 */
export async function computeBlendedRiskScore(companyId, quotationId, customerTier, db = prisma) {
  const [lines, discountTier, categoryLimits] = await Promise.all([
    db.quotationLine.findMany({
      where: { quotationId },
      include: { product: { select: { category: true } } },
    }),
    db.discountTier.findUnique({
      where: { companyId_tier: { companyId, tier: customerTier } },
    }),
    db.categoryDiscountLimit.findMany({ where: { companyId } }),
  ]);

  const tierLimitPct = discountTier ? Number(discountTier.maxDiscountPercent) : 0;
  const categoryLimitMap = Object.fromEntries(
    categoryLimits.map((c) => [c.category, Number(c.maxDiscountPercent)])
  );

  let score = 0;
  for (const line of lines) {
    const categoryLimitPct = categoryLimitMap[line.product.category] ?? 0;
    const effectiveLimit = Math.min(tierLimitPct, categoryLimitPct);
    const askedDiscount = Number(line.discountPercent);
    // MAX(0, ...) clamp ensures compliant lines contribute exactly 0, never negative
    score += Math.max(0, askedDiscount - effectiveLimit);
  }

  return Math.round(score * 100) / 100;
}

/**
 * Fetches the current discount limits for a company — used to snapshot
 * into NegotiationProposal.snapshotLimits at proposal creation time.
 *
 * @param {string} companyId
 * @param {string} customerTier
 * @returns {Promise<{ tierLimit: number|null, categoryLimits: Record<string,number> }>}
 */
export async function fetchCurrentLimits(companyId, customerTier) {
  const [discountTier, categoryLimits] = await Promise.all([
    prisma.discountTier.findUnique({
      where: { companyId_tier: { companyId, tier: customerTier } },
    }),
    prisma.categoryDiscountLimit.findMany({ where: { companyId } }),
  ]);

  return {
    tierLimit: discountTier ? Number(discountTier.maxDiscountPercent) : null,
    categoryLimits: Object.fromEntries(
      categoryLimits.map((c) => [c.category, Number(c.maxDiscountPercent)])
    ),
  };
}
