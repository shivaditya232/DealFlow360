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

// Edit screen — every field optional (partial update), but at least one must
// be present or there's nothing to do. Doesn't touch the upsell relation;
// that's managed separately (create-time only for now, same as before).
export const updateProductSchema = z
  .object({
    name: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
    basePrice: z.number().nonnegative().optional(),
    unit: z.string().min(1).optional(),
    taxRate: z.number().min(0).max(100).optional(),
    marginPercent: z.number().min(0).max(100).optional(),
    description: z.string().max(2000).optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });
