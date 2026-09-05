import prisma from "../config/prisma.js";
import { hashPassword, comparePassword } from "../utils/password.util.js";
import { signAccessToken } from "../utils/jwt.util.js";
import { assertNotRateLimited, recordFailedAttempt, clearFailedAttempts } from "../utils/rateLimit.util.js";
import { httpError } from "../utils/httpError.js";

async function resolveCompany(companySlug) {
  const company = await prisma.company.findUnique({ where: { slug: companySlug } });
  if (!company) throw httpError(404, "Company not found");
  return company;
}

function buildToken({ id, companyId, accountType, role }) {
  return signAccessToken({ sub: id, companyId, accountType, role: role ?? null });
}

export async function signup({ companySlug, accountType, email, password, name, role }) {
  const company = await resolveCompany(companySlug);
  const passwordHash = await hashPassword(password);

  if (accountType === "INTERNAL") {
    const existing = await prisma.user.findUnique({
      where: { companyId_email: { companyId: company.id, email } },
    });
    if (existing) throw httpError(409, "An account with this email already exists in this company");

    const user = await prisma.user.create({
      data: { companyId: company.id, email, passwordHash, name, role },
    });
    const token = buildToken({ id: user.id, companyId: company.id, accountType, role: user.role });
    return {
      token,
      landing: "DASHBOARD",
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }

  // accountType === "CUSTOMER" — the Customer row may already exist if a rep
  // created it while building a quotation, just with no portal password yet.
  const existingCustomer = await prisma.customer.findUnique({
    where: { companyId_email: { companyId: company.id, email } },
  });

  let customer;
  if (existingCustomer) {
    if (existingCustomer.portalPasswordHash) {
      throw httpError(409, "This customer already has a portal account");
    }
    customer = await prisma.customer.update({
      where: { id: existingCustomer.id },
      data: { portalPasswordHash: passwordHash, name },
    });
  } else {
    customer = await prisma.customer.create({
      data: { companyId: company.id, email, name, portalPasswordHash: passwordHash },
    });
  }

  const token = buildToken({ id: customer.id, companyId: company.id, accountType, role: null });
  return {
    token,
    landing: "PORTAL",
    customer: { id: customer.id, name: customer.name, email: customer.email },
  };
}

export async function login({ companySlug, email, password }) {
  const company = await resolveCompany(companySlug);

  // Redis-backed brute-force guard, scoped per company+email so one bad actor
  // can't lock out unrelated accounts.
  await assertNotRateLimited(companySlug, email);

  const user = await prisma.user.findUnique({
    where: { companyId_email: { companyId: company.id, email } },
  });
  if (user) {
    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) {
      await recordFailedAttempt(companySlug, email);
      throw httpError(401, "Invalid credentials");
    }
    await clearFailedAttempts(companySlug, email);
    const token = buildToken({ id: user.id, companyId: company.id, accountType: "INTERNAL", role: user.role });
    return {
      token,
      landing: "DASHBOARD",
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }

  const customer = await prisma.customer.findUnique({
    where: { companyId_email: { companyId: company.id, email } },
  });
  if (customer && customer.portalPasswordHash) {
    const ok = await comparePassword(password, customer.portalPasswordHash);
    if (!ok) {
      await recordFailedAttempt(companySlug, email);
      throw httpError(401, "Invalid credentials");
    }
    await clearFailedAttempts(companySlug, email);
    const token = buildToken({ id: customer.id, companyId: company.id, accountType: "CUSTOMER", role: null });
    return {
      token,
      landing: "PORTAL",
      customer: { id: customer.id, name: customer.name, email: customer.email },
    };
  }

  await recordFailedAttempt(companySlug, email);
  throw httpError(401, "Invalid credentials");
}
