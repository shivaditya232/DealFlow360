import { z } from "zod";

// Email-only schema — used for POST /api/otp/request
export const requestOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});

// Email + OTP schema — used for POST /api/otp/verify
// .length(6) + /^\d{6}$/ together ensure exactly 6 numeric digits — no letters,
// no symbols, no leading whitespace sneaking through.
export const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must be numeric"),
});
