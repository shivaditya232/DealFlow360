import prisma from "../config/prisma.js";

export async function listProducts(companyId) {
  return prisma.product.findMany({
    where: { companyId },
    include: { variants: true },
    orderBy: { name: "asc" },
  });
}
