import prisma from "../config/prisma.js";
import { httpError } from "../utils/httpError.js";

export async function listCustomers(companyId) {
  return prisma.customer.findMany({
    where: { companyId },
    select: { id: true, name: true, email: true, tier: true, reliabilityScore: true },
    orderBy: { name: "asc" },
  });
}

// Reps creating a customer to quote against — no portal password set here,
// the customer sets one later via /api/auth/signup (accountType CUSTOMER),
// which upserts onto this same row by companyId+email.
export async function createCustomer({ companyId, name, email, tier }) {
  const existing = await prisma.customer.findUnique({ where: { companyId_email: { companyId, email } } });
  if (existing) throw httpError(409, "A customer with this email already exists");

  return prisma.customer.create({ data: { companyId, name, email, tier } });
}
