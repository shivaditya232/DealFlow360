import { z } from "zod";

export const createQuotationSchema = z.object({
  customerId: z.string().min(1),
});

export const addLineSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity: z.number().int().positive(),
  discountPercent: z.number().min(0).max(100).default(0),
  lineType: z.enum(["ONE_TIME", "RECURRING"]).default("ONE_TIME"),
});

export const updateLineSchema = z.object({
  quantity: z.number().int().positive().optional(),
  discountPercent: z.number().min(0).max(100).optional(),
});

export const listQuotationsQuerySchema = z.object({
  status: z
    .enum(["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "NEGOTIATING", "CONFIRMED", "FULFILLED", "CANCELLED"])
    .optional(),
});
