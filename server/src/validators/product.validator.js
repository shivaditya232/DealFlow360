import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  basePrice: z.number().nonnegative(),
  unit: z.string().min(1),
  taxRate: z.number().min(0).max(100).default(0),
  marginPercent: z.number().min(0).max(100).default(0),
  description: z.string().max(2000).optional().nullable(),
});
