import { z } from "zod";

// Warehouse itself is just { name, shippingCostWeight } — StockLevel rows
// (per-product quantity in a given warehouse) are managed separately via
// /api/stock (stock.service.js's addStock), not here.
export const createWarehouseSchema = z.object({
  name: z.string().min(1),
  shippingCostWeight: z.number().min(0),
});

export const updateWarehouseSchema = z
  .object({
    name: z.string().min(1).optional(),
    shippingCostWeight: z.number().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });
