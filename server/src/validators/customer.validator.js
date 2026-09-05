import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  tier: z.enum(["BRONZE", "SILVER", "GOLD"]).default("BRONZE"),
});
