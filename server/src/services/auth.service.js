import prisma from "../config/prisma.js";
import { hashPassword, comparePassword } from "../utils/password.util.js";
import { signAccessToken } from "../utils/jwt.util.js";
import { assertNotRateLimited, recordFailedAttempt, clearFailedAttempts } from "../utils/rateLimit.util.js";
import { httpError } from "../utils/httpError.js";
import { isEmailVerified, consumeEmailVerification } from "./otp.service.js";

// Login always needs an EXISTING company (you can't log in to a workspace
// that hasn't been created yet).
async function resolveCompany(companySlug) {
  const company = await prisma.company.findUnique({ where: { slug: companySlug } });
  if (!company) throw httpError(404, "Company not found");
  return company;
}

// Turns "my-new-company" into "My New Company" — good enough as a default
// display name; nothing currently lets a company rename itself later.
function deriveCompanyName(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

// Signup, unlike login, can create the company: if this is the first person
// to use this companySlug, they're standing up a brand-new workspace and
// become its ADMIN. If the slug already exists, they're joining a workspace
// someone else already created.
async function resolveOrCreateCompany(companySlug) {
  const existing = await prisma.company.findUnique({ where: { slug: companySlug } });
  if (existing) return { company: existing, isNewCompany: false };

  const company = await prisma.company.create({
    data: { slug: companySlug, name: deriveCompanyName(companySlug) },
  });
  return { company, isNewCompany: true };
}

function buildToken({ id, companyId, accountType, role }) {
  return signAccessToken({ sub: id, companyId, accountType, role: role ?? null });
}

// role is intentionally NOT accepted from the caller here — see below.
export async function signup({ companySlug, accountType, email, password, name }) {
  // Email must have been OTP-verified (POST /api/otp/request then /api/otp/verify)
  // within the last 15 minutes before signup will create anything. This is what
  // actually confirms the address is real/reachable, not just well-formed.
  if (!(await isEmailVerified(email))) {
    throw httpError(400, "Please verify your email with the OTP before creating an account.");
  }

  const passwordHash = await hashPassword(password);

  if (accountType === "INTERNAL") {
    // Signup (unlike login) may create the company: first person to use a
    // given companySlug stands up that workspace and becomes its ADMIN.
    // Anyone signing up after that is JOINING an existing workspace, and can
    // only ever self-register as SALES_REP — MANAGER/FINANCE/ADMIN are never
    // accepted from the client (that was the original privilege-escalation
    // bug: any caller could POST role:"ADMIN" and grant themselves admin on
    // someone else's company). There's no invite flow yet to promote a
    // SALES_REP to MANAGER/FINANCE after the fact — that's a follow-up.
    const { company, isNewCompany } = await resolveOrCreateCompany(companySlug);
    const role = isNewCompany ? "ADMIN" : "SALES_REP";

    const existing = await prisma.user.findUnique({
      where: { companyId_email: { companyId: company.id, email } },
    });
    if (existing) throw httpError(409, "An account with this email already exists in this company");

    const user = await prisma.user.create({
      data: { companyId: company.id, email, passwordHash, name, role },
    });
    await consumeEmailVerification(email);
    const token = buildToken({ id: user.id, companyId: company.id, accountType, role: user.role });
    return {
      token,
      landing: "DASHBOARD",
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      company: { id: company.id, slug: company.slug, name: company.name, isNewCompany },
    };
  }

  // accountType === "CUSTOMER" — customers can only join a company that
  // already exists (a customer can't stand up someone else's workspace).
  const company = await resolveCompany(companySlug);

  // The Customer row may already exist if a rep created it while building a
  // quotation, just with no portal password yet.
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

  await consumeEmailVerification(email);
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
