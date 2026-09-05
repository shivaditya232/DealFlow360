import prisma from "../config/prisma.js";

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
export async function createProduct(companyId, data) {
  return prisma.product.create({
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
}
