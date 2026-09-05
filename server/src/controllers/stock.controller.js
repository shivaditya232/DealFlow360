import { addStock } from "../services/stock.service.js";
import { addStockSchema } from "../validators/stock.validator.js";

/**
 * POST /api/stock/add
 * Admin only — adds stock to a warehouse+product and triggers backorder consolidation.
 */
export async function addStockHandler(req, res, next) {
  try {
    const { warehouseId, productId, quantity } = addStockSchema.parse(req.body);
    const result = await addStock(req.auth.companyId, { warehouseId, productId, quantity });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
