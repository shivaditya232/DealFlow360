// Mirrors the backend's utils/riskCalculator.js + utils/approvalRouter.js so
// the UI can label a risk score consistently without a round trip for every
// row. companyLimits comes from GET /api/config/discount-limits.

export function effectiveLimit(line, companyLimits) {
  const tier = Number(
    companyLimits.tiers.find((t) => t.tier === line.customerTier)?.maxDiscountPercent ?? 100
  );
  const category = Number(
    companyLimits.categoryLimits.find((c) => c.category === line.category)?.maxDiscountPercent ?? 100
  );
  return Math.min(tier, category);
}

export function resolveRiskLabel(blendedRiskScore, approvalChainRules) {
  const score = Number(blendedRiskScore ?? 0);
  const rule = [...approvalChainRules]
    .sort((a, b) => a.priority - b.priority)
    .find((r) => score >= Number(r.minDiscountPercent) && score < Number(r.maxDiscountPercent));

  if (!rule || (!rule.requiresManager && !rule.requiresFinance)) return { label: 'LOW', rule: null };
  if (rule.requiresFinance) return { label: 'HIGH', rule };
  return { label: 'MEDIUM', rule };
}

export const RISK_COLORS = {
  LOW: 'var(--risk-low)',
  MEDIUM: 'var(--risk-medium)',
  HIGH: 'var(--risk-high)',
};
