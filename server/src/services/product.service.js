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
