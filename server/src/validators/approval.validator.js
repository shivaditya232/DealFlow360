import { z } from "zod";

export const approvalActSchema = z
  .object({
    action: z.enum(["APPROVE", "REJECT", "RETURN"]),
    reason: z.string().max(1000).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if ((data.action === "REJECT" || data.action === "RETURN") && !data.reason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "reason is required when rejecting or returning a quotation",
        path: ["reason"],
      });
    }
  });
