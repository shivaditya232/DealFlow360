import { z } from "zod";
import { QuotationStatus } from "@prisma/client";

export const reportQuerySchema = z.object({
  dateFrom: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val))
    .refine((val) => !val || !isNaN(Date.parse(val)), { message: "Invalid dateFrom" }),
  dateTo: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val))
    .refine((val) => !val || !isNaN(Date.parse(val)), { message: "Invalid dateTo" }),
  repId: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  status: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val))
    .pipe(z.nativeEnum(QuotationStatus).optional()),
  productId: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  category: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  format: z.enum(["json", "pdf", "xlsx"]).default("json"),
});
