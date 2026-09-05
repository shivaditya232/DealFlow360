import prisma from "../config/prisma.js";
import { logAction } from "./audit.service.js";
import { buildLineBreakdown } from "../utils/risk.util.js";
import { httpError } from "../utils/httpError.js";
// Shared with the friend's Approval module — one formula, used everywhere.
import { computeBlendedRiskScore } from "../utils/riskCalculator.js";
import { resolveApprovalSteps } from "../utils/approvalRouter.js";

function lineTotal(line) {
  const gross = Number(line.quantity) * Number(line.unitPrice);
  return gross * (1 - Number(line.discountPercent) / 100);
}

// Bug fix: this used to scope by companyId ALONE, so any authenticated
// internal user — including a plain SALES_REP — could view, edit lines on,
// delete lines from, or submit-for-approval ANY OTHER rep's quotation in the
// same company, just by knowing/guessing its id (requireInternal only checks
// accountType, not role). A Sales Rep is now scoped to quotations where
// repId === their own userId; Manager/Finance/Admin keep company-wide
// visibility, since they need it for approvals, deal health, and reporting.
async function getScopedQuotation(companyId, quotationId, include = {}, { userId, role } = {}) {
  const quotation = await prisma.quotation.findFirst({
    where: {
      id: quotationId,
      companyId,
      ...(role === "SALES_REP" ? { repId: userId } : {}),
    },
    include,
  });
  if (!quotation) throw httpError(404, "Quotation not found");
  return quotation;
}

export async function createQuotation({ companyId, repId, customerId }) {
  // Bug fix: this used to require { id: customerId, companyId }, restricting
  // quotations to customers that belonged to the rep's own company. Reps can
  // now sell to any customer on the platform (see customer.service.js) — the
  // quotation itself still belongs to the rep's own company (companyId
  // below), only the customer lookup is no longer company-scoped.
  const customer = await prisma.customer.findFirst({ where: { id: customerId } });
  if (!customer) throw httpError(404, "Customer not found");

  const quotation = await prisma.quotation.create({
    data: { companyId, customerId, repId },
  });
  await logAction({ companyId, userId: repId, entityType: "Quotation", entityId: quotation.id, action: "CREATED" });
  return quotation;
}

export async function listQuotations({ companyId, status, userId, role }) {
  const quotations = await prisma.quotation.findMany({
    // See the ownership-scoping comment on getScopedQuotation above — same
    // fix applies here: a Sales Rep must only see their own quotations in
    // this list, not the whole company's.
    where: {
      companyId,
      ...(status ? { status } : {}),
      ...(role === "SALES_REP" ? { repId: userId } : {}),
    },
    include: { customer: { select: { id: true, name: true } }, lines: true },
    orderBy: { updatedAt: "desc" },
  });
  return quotations.map((q) => ({
    id: q.id,
    customerId: q.customer.id,
    customerName: q.customer.name,
    status: q.status,
    amount: Math.round(q.lines.reduce((sum, l) => sum + lineTotal(l), 0) * 100) / 100,
    updatedAt: q.updatedAt,
  }));
}

export async function getQuotationDetail({ companyId, quotationId, userId, role }) {
  const quotation = await getScopedQuotation(companyId, quotationId, {
    customer: true,
    rep: { select: { id: true, name: true } },
    lines: { include: { product: true, variant: true } },
    // Read-only view of the negotiation/chat thread (rows live in the
    // friend's NegotiationProposal-backed portal module — reps reply via
    // POST /api/portal/proposals/:proposalId/respond, this is just visibility
    // on the internal Quotation Detail screen).
    negotiationProposals: {
      include: {
        proposedByUser: { select: { name: true } },
        proposedByCustomer: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    },
  }, { userId, role });

  const lineBreakdown = buildLineBreakdown(quotation.lines);
  const breakdownByLineId = Object.fromEntries(lineBreakdown.map((b) => [b.lineId, b]));

  return {
    id: quotation.id,
    status: quotation.status,
    blendedRiskScore: quotation.blendedRiskScore,
    customer: { id: quotation.customer.id, name: quotation.customer.name, tier: quotation.customer.tier },
    rep: quotation.rep,
    lines: quotation.lines.map((line) => ({
      id: line.id,
      product: { id: line.product.id, name: line.product.name, category: line.product.category },
      variant: line.variant ? { id: line.variant.id, attributeName: line.variant.attributeName, attributeValue: line.variant.attributeValue } : null,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      discountPercent: line.discountPercent,
      limit: breakdownByLineId[line.id].limit,
      status: breakdownByLineId[line.id].status,
      lineTotal: Math.round(lineTotal(line) * 100) / 100,
      lineType: line.lineType,
    })),
    negotiationThread: quotation.negotiationProposals.map((p) => ({
      id: p.id,
      lineId: p.lineId,
      from: p.proposedByType,
      fromName: p.proposedByUser?.name ?? p.proposedByCustomer?.name ?? p.proposedByType,
      message: p.message,
      proposedChanges: p.proposedChanges,
      status: p.status,
      createdAt: p.createdAt,
    })),
  };
}

async function priceLine({ companyId, customerTier, productId, variantId, quantity }) {
  const product = await prisma.product.findFirst({ where: { id: productId, companyId } });
  if (!product) throw httpError(404, "Product not found");

  let variant = null;
  if (variantId) {
    variant = await prisma.productVariant.findFirst({ where: { id: variantId, productId } });
    if (!variant) throw httpError(404, "Product variant not found");
  }

  const priceListEntry = await prisma.priceListEntry.findFirst({
    where: { productId, tier: customerTier },
  });
  const basePrice = priceListEntry ? Number(priceListEntry.price) : Number(product.basePrice);
  const unitPrice = basePrice + Number(variant?.extraPrice ?? 0);

  const categoryLimit = await prisma.categoryDiscountLimit.findFirst({
    where: { companyId, category: product.category },
  });
  const tierLimit = await prisma.discountTier.findFirst({ where: { companyId, tier: customerTier } });

  return {
    product,
    unitPrice,
    // Fall back to 100 (no ceiling) if a category/tier has no configured row yet
    // rather than silently blocking every discount at 0.
    categoryLimitAtTime: categoryLimit ? Number(categoryLimit.maxDiscountPercent) : 100,
    tierLimitAtTime: tierLimit ? Number(tierLimit.maxDiscountPercent) : 100,
  };
}

export async function addLine({ companyId, quotationId, productId, variantId, quantity, discountPercent, lineType, userId, role }) {
  const quotation = await getScopedQuotation(companyId, quotationId, { customer: true }, { userId, role });
  if (quotation.status !== "DRAFT") throw httpError(409, "Only draft quotations can be edited");

  const { unitPrice, categoryLimitAtTime, tierLimitAtTime } = await priceLine({
    companyId,
    customerTier: quotation.customer.tier,
    productId,
    variantId,
    quantity,
  });

  const line = await prisma.quotationLine.create({
    data: {
      quotationId,
      productId,
      variantId,
      quantity,
      unitPrice,
      discountPercent,
      categoryLimitAtTime,
      tierLimitAtTime,
      lineType,
    },
  });
  await prisma.quotation.update({ where: { id: quotationId }, data: { lastActivityAt: new Date() } });

  return { ...line, ...buildLineBreakdown([line])[0] };
}

export async function updateLine({ companyId, quotationId, lineId, quantity, discountPercent, userId, role }) {
  const quotation = await getScopedQuotation(companyId, quotationId, {}, { userId, role });
  if (quotation.status !== "DRAFT") throw httpError(409, "Only draft quotations can be edited");

  const existing = await prisma.quotationLine.findFirst({ where: { id: lineId, quotationId } });
  if (!existing) throw httpError(404, "Line not found");

  const line = await prisma.quotationLine.update({
    where: { id: lineId },
    data: {
      ...(quantity !== undefined ? { quantity } : {}),
      ...(discountPercent !== undefined ? { discountPercent } : {}),
    },
  });
  await prisma.quotation.update({ where: { id: quotationId }, data: { lastActivityAt: new Date() } });

  // Live limit check — returned immediately, never blocks the save (mockup:
  // checked "as soon as it is entered, not only at submit time").
  return { ...line, ...buildLineBreakdown([line])[0] };
}

export async function deleteLine({ companyId, quotationId, lineId, userId, role }) {
  const quotation = await getScopedQuotation(companyId, quotationId, {}, { userId, role });
  if (quotation.status !== "DRAFT") throw httpError(409, "Only draft quotations can be edited");

  const existing = await prisma.quotationLine.findFirst({ where: { id: lineId, quotationId } });
  if (!existing) throw httpError(404, "Line not found");

  await prisma.quotationLine.delete({ where: { id: lineId } });
  await prisma.quotation.update({ where: { id: quotationId }, data: { lastActivityAt: new Date() } });
}

export async function getUpsellSuggestions({ companyId, quotationId, userId, role }) {
  const quotation = await getScopedQuotation(companyId, quotationId, { lines: true }, { userId, role });
  const productIds = [...new Set(quotation.lines.map((l) => l.productId))];
  if (productIds.length === 0) return [];

  const rules = await prisma.upsellRule.findMany({
    where: { companyId, baseProductId: { in: productIds } },
    include: { suggestedProduct: true },
  });

  // Only surface suggestions whose margin clears the rule's configured floor
  // (PS: "minimum margin thresholds so only healthy-margin suggestions surface").
  return rules
    .filter((rule) => Number(rule.suggestedProduct.marginPercent) >= Number(rule.minMarginPercent))
    .map((rule) => ({
      productId: rule.suggestedProduct.id,
      name: rule.suggestedProduct.name,
      isPromoted: rule.isPromoted,
      marginPercent: rule.suggestedProduct.marginPercent,
      marginAmount:
        Math.round(Number(rule.suggestedProduct.basePrice) * (Number(rule.suggestedProduct.marginPercent) / 100) * 100) /
        100,
    }));
}

// Shared by submit-for-approval and by negotiation.service when a re-approval
// is triggered post-acceptance. Recomputes risk off current lines, either
// auto-approves or (re)builds the ApprovalStep chain, and persists it.
export async function runApprovalRouting({ companyId, quotationId, customerTier, actingUserId = null }) {
  const lines = await prisma.quotationLine.findMany({ where: { quotationId } });
  if (lines.length === 0) throw httpError(400, "Cannot submit a quotation with no line items");

  // Friend's finalized formula: SUM(MAX(0, discount% - effectiveLimit%)) across lines.
  const blendedRiskScore = await computeBlendedRiskScore(companyId, quotationId, customerTier);
  const steps = await resolveApprovalSteps(companyId, blendedRiskScore);

  await prisma.approvalStep.deleteMany({ where: { quotationId, status: "PENDING" } });

  if (steps.length === 0) {
    await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: "APPROVED", blendedRiskScore, lastActivityAt: new Date() },
    });
    await logAction({
      companyId,
      userId: actingUserId,
      entityType: "Quotation",
      entityId: quotationId,
      action: "APPROVED",
      metadata: { auto: true, blendedRiskScore },
    });
    return { status: "APPROVED", blendedRiskScore };
  }

  await prisma.$transaction([
    prisma.quotation.update({
      where: { id: quotationId },
      data: { status: "PENDING_APPROVAL", blendedRiskScore, lastActivityAt: new Date() },
    }),
    prisma.approvalStep.createMany({ data: steps.map((s) => ({ quotationId, ...s })) }),
  ]);
  await logAction({
    companyId,
    userId: actingUserId,
    entityType: "Quotation",
    entityId: quotationId,
    action: "SUBMITTED",
    metadata: { blendedRiskScore, steps: steps.map((s) => s.approverRole) },
  });
  return { status: "PENDING_APPROVAL", blendedRiskScore };
}

export async function submitQuotation({ companyId, quotationId, actingUserId, role }) {
  const quotation = await getScopedQuotation(companyId, quotationId, { customer: true }, { userId: actingUserId, role });
  if (!["DRAFT", "NEGOTIATING"].includes(quotation.status)) {
    throw httpError(409, "Only draft or negotiating quotations can be submitted");
  }
  return runApprovalRouting({ companyId, quotationId, customerTier: quotation.customer.tier, actingUserId });
}
