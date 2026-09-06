import prisma from "../config/prisma.js";
import { httpError } from "../utils/httpError.js";

export async function listProducts(companyId) {
  return prisma.product.findMany({
    where: { companyId },
    include: { variants: true },
    orderBy: { name: "asc" },
  });
}

// Admin-only (gated at the route level) — the catalog itself (name, category,
// base price, unit, tax, margin) was previously only ever seeded, never
// created through the app; there was no Products screen or endpoint for it
// at all. Variants and per-tier price lists (mockup screen 17) are a
// separate, larger screen not built yet — this covers the screen 16 basics.
//
// Optionally also registers this new product as an upsell suggestion for an
// existing base product (data.upsell), creating the matching UpsellRule row
// in the same transaction so a product is never left half-created if that
// insert fails (e.g. a stale/foreign-company baseProductId).
export async function createProduct(companyId, data) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        companyId,
        name: data.name,
        category: data.category,
        basePrice: data.basePrice,
        unit: data.unit,
        taxRate: data.taxRate,
        marginPercent: data.marginPercent,
        description: data.description ?? null,
      },
    });

    if (data.upsell?.baseProductId) {
      // Guard against a baseProductId from another company (or a typo'd id)
      // silently creating a cross-tenant UpsellRule.
      const baseProduct = await tx.product.findFirst({
        where: { id: data.upsell.baseProductId, companyId },
      });
      if (!baseProduct) {
        throw httpError(400, "Base product not found");
      }

      await tx.upsellRule.create({
        data: {
          companyId,
          baseProductId: data.upsell.baseProductId,
          suggestedProductId: product.id,
          minMarginPercent: data.upsell.minMarginPercent ?? 0,
          isPromoted: data.upsell.isPromoted ?? false,
        },
      });
    }

    return product;
  });
}

// Admin-only — edit the catalog entry itself. Was previously write-once
// (create only, no way to fix a typo'd price/name without hand-editing the
// DB) — this is a straight partial update, scoped to companyId so an Admin
// can never touch another company's product by guessing an id.
export async function updateProduct(companyId, productId, data) {
  const existing = await prisma.product.findFirst({ where: { id: productId, companyId } });
  if (!existing) throw httpError(404, "Product not found");

  return prisma.product.update({
    where: { id: productId },
    data,
  });
}

// Admin-only — remove a product from the catalog. Hard-deletes at the DB
// level; Product has FK relations from QuotationLine/StockLevel/
// SubscriptionPlan/UpsellRule with no onDelete: Cascade, so Postgres itself
// refuses the delete (P2003) once the product has been used anywhere. That's
// treated as an expected, user-facing condition (409) rather than a crash —
// a product that's actually been quoted/stocked isn't safe to delete outright
// (it would corrupt existing quotations' line items), so the message tells
// the Admin to edit it instead.
export async function deleteProduct(companyId, productId) {
  const existing = await prisma.product.findFirst({ where: { id: productId, companyId } });
  if (!existing) throw httpError(404, "Product not found");

  try {
    await prisma.product.delete({ where: { id: productId } });
  } catch (err) {
    if (err.code === "P2003" || err.code === "P2014") {
      throw httpError(
        409,
        "Can't delete this product — it's already used in one or more quotations, stock records, or subscription plans. Edit it instead, or remove those references first."
      );
    }
    throw err;
  }
  return { id: productId, deleted: true };
}
