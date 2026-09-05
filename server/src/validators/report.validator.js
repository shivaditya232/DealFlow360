import { z } from "zod";
import { QuotationStatus } from "@prisma/client";

export const reportQuerySchema = z.object({
  dateFrom: z.string().datetime({ offset: true }).optional(),
  dateTo: z.string().datetime({ offset: true }).optional(),
  repId: z.string().optional(),
  status: z.nativeEnum(QuotationStatus).optional(),
  productId: z.string().optional(),
  category: z.string().optional(),
  format: z.enum(["json", "pdf", "xlsx"]).default("json"),
});
