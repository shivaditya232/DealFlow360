import prisma from "../config/prisma.js";
import { httpError } from "../utils/httpError.js";

// Bug fix: this used to filter `where: { companyId }`, so a rep could only
// see/sell to customers that had originally been created under their own
// company. Per user's explicit instruction, that's now inverted — reps sell
// across the whole platform's customer base, not just their own company's.
// `company` is included so the UI can show which company originally created
// each customer (useful context now that the list spans companies).
export async function listCustomers() {
  return prisma.customer.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      tier: true,
      reliabilityScore: true,
      company: { select: { name: true } },
    },
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
