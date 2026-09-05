import { z } from "zod";

export const addStockSchema = z.object({
  warehouseId: z.string().min(1, "warehouseId is required"),
  productId: z.string().min(1, "productId is required"),
  quantity: z.number().int().positive("quantity must be a positive integer"),
});
