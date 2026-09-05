import { z } from "zod";

// NOTE: `role` is deliberately NOT part of this schema. Self-service signup
// can only ever produce a SALES_REP (joining an existing company) or an
// ADMIN (creating a brand-new company) — auth.service.js computes which,
// server-side. Accepting a client-supplied role here would let anyone POST
// role:"ADMIN" or role:"MANAGER" and grant themselves elevated access on any
// company whose slug they know — that was the original bug. MANAGER/FINANCE
// accounts don't have a signup path yet; they'll need an invite flow.
export const signupSchema = z.object({
  companySlug: z.string().min(1, "companySlug is required"),
  accountType: z.enum(["INTERNAL", "CUSTOMER"]),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1),
});

export const loginSchema = z.object({
  companySlug: z.string().min(1, "companySlug is required"),
  email: z.string().email(),
  password: z.string().min(1, "password is required"),
});
