import { z } from "zod";

const USER_ROLES = ["SALES_REP", "MANAGER", "FINANCE", "ADMIN"];

export const signupSchema = z
  .object({
    companySlug: z.string().min(1, "companySlug is required"),
    accountType: z.enum(["INTERNAL", "CUSTOMER"]),
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    name: z.string().min(1),
    // required only for INTERNAL accounts — which internal role this user is
    role: z.enum(USER_ROLES).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.accountType === "INTERNAL" && !data.role) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "role is required when accountType is INTERNAL",
        path: ["role"],
      });
    }
  });

export const loginSchema = z.object({
  companySlug: z.string().min(1, "companySlug is required"),
  email: z.string().email(),
  password: z.string().min(1, "password is required"),
});

// Admin directly creating a MANAGER/FINANCE/SALES_REP/ADMIN teammate in
// their OWN company (companyId comes from the Admin's auth token, never
// the client — unlike signup there's no companySlug here, since this can
// only ever target the caller's own company). Still requires the same
// OTP-verified-email gate as signup (see authService.createTeamMember) —
// this bypasses the self-registration FORM, not identity verification.
export const createTeamMemberSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(USER_ROLES),
});

// Admin editing an existing teammate's name/role — both optional (partial
// update), but at least one must be present. No email/password change here;
// that's a separate "reset password" flow not built yet.
export const updateTeamMemberSchema = z
  .object({
    name: z.string().min(1).optional(),
    role: z.enum(USER_ROLES).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });
