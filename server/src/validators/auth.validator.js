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

