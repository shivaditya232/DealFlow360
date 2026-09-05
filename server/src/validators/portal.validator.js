import { z } from "zod";

// Shape of proposedChanges — at least one field must be present when changes are supplied
const proposedChangesSchema = z
  .object({
    discountPercent: z.number().min(0).max(100).optional(),
    quantity: z.number().int().positive().optional(),
  })
  .refine((d) => d.discountPercent !== undefined || d.quantity !== undefined, {
    message: "proposedChanges must include at least discountPercent or quantity",
  });

/**
 * Customer creating/overwriting a negotiation proposal.
 * Must have at least one of: proposedChanges, message, requestedDeliveryDate.
 */
export const proposalSchema = z
  .object({
    lineId: z.string().cuid().optional().nullable(),
    proposedChanges: proposedChangesSchema.optional().nullable(),
    message: z.string().max(2000).optional().nullable(),
    requestedDeliveryDate: z.string().datetime().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const hasContent =
      data.proposedChanges != null ||
      (data.message && data.message.trim().length > 0) ||
      data.requestedDeliveryDate != null;
    if (!hasContent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Proposal must include at least one of: proposedChanges, message, or requestedDeliveryDate",
      });
    }
  });

/**
 * Customer rejecting the rep's current counter-offer outright (no counter
 * discount attached — just a decline, optionally with a reason the rep can
 * see in the negotiation thread). Use proposalSchema instead when the
 * customer wants to send back a counter discount.
 */
export const customerRejectSchema = z.object({
  message: z.string().max(2000).optional().nullable(),
});

/**
 * Rep responding to a pending proposal: ACCEPT, REJECT, or COUNTER.
 * COUNTER requires proposedChanges.
 */
export const repResponseSchema = z
  .object({
    action: z.enum(["ACCEPT", "REJECT", "COUNTER"]),
    proposedChanges: proposedChangesSchema.optional().nullable(),
    message: z.string().max(2000).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.action === "COUNTER" && data.proposedChanges == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "proposedChanges is required when action is COUNTER",
        path: ["proposedChanges"],
      });
    }
  });
