import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  basePrice: z.number().nonnegative(),
  unit: z.string().min(1),
  taxRate: z.number().min(0).max(100).default(0),
  marginPercent: z.number().min(0).max(100).default(0),
  description: z.string().max(2000).optional().nullable(),

  // Optional: register this new product as an upsell suggestion for an
  // existing "base" product — e.g. creating "Extended Warranty" and marking
  // "Laptop Pro 14" as its base product means reps get it recommended
  // (getUpsellSuggestions in quotation.service.js) whenever a quotation
  // already contains the base product. Maps straight onto the existing
  // UpsellRule model (baseProductId/suggestedProductId/minMarginPercent/
  // isPromoted) — no schema change needed, this was just never wired up to
  // product creation before.
  upsell: z
    .object({
      baseProductId: z.string().min(1),
      minMarginPercent: z.number().min(0).max(100).default(0),
      isPromoted: z.boolean().default(false),
    })
    .optional()
    .nullable(),
});
