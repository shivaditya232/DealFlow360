// Per-line display helpers for the Quotation Detail table (Screen 4's
// Product/Qty/Price/Discount/Limit/Status columns).
//
// This is display-only. The actual blended risk score and approval routing
// decision live in utils/riskCalculator.js + utils/approvalRouter.js (the
// finalized team formula) — this file must not duplicate that logic, just
// annotate each line with its own OK/OVER status as it's typed in.

export function effectiveLimit(line) {
  return Math.min(Number(line.categoryLimitAtTime), Number(line.tierLimitAtTime));
}

export function lineOveragePoints(line) {
  return Math.max(0, Number(line.discountPercent) - effectiveLimit(line));
}

export function buildLineBreakdown(lines) {
  return lines.map((line) => {
    const overagePoints = lineOveragePoints(line);
    return {
      lineId: line.id,
      limit: effectiveLimit(line),
      overagePoints,
      status: overagePoints > 0 ? `OVER (+${overagePoints}pt)` : "OK",
    };
  });
}
