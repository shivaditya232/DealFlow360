import { z } from "zod";

const tierEnum = z.enum(["BRONZE", "SILVER", "GOLD"]);

const ruleSchema = z
  .object({
    minDiscountPercent: z.number().min(0),
    maxDiscountPercent: z.number().min(0),
    requiresManager: z.boolean().default(true),
    requiresFinance: z.boolean().default(false),
    priority: z.number().int().default(0),
  })
  .refine((r) => r.maxDiscountPercent >= r.minDiscountPercent, {
    message: "maxDiscountPercent must be >= minDiscountPercent",
    path: ["maxDiscountPercent"],
  });

/**
 * Whole-screen save for the Admin "Discount tiers and approval chains"
 * config screen (mockup screen 18) — one "Save configuration" button submits
 * all three tables together, so this validates/replaces all three at once
 * rather than exposing granular per-row CRUD endpoints.
 */
export const updateDiscountLimitsSchema = z.object({
  tiers: z
    .array(
      z.object({
        tier: tierEnum,
        maxDiscountPercent: z.number().min(0).max(100),
      })
    )
    .min(1),
  categoryLimits: z.array(
    z.object({
      category: z.string().min(1),
      maxDiscountPercent: z.number().min(0).max(100),
    })
  ),
  approvalChainRules: z.array(ruleSchema),
});
