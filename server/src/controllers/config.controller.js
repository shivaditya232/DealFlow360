import { updateDiscountLimitsSchema } from "../validators/config.validator.js";
import * as configService from "../services/config.service.js";

export async function getDiscountLimits(req, res, next) {
  try {
    const result = await configService.getDiscountLimits(req.auth.companyId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateDiscountLimits(req, res, next) {
  try {
    const data = updateDiscountLimitsSchema.parse(req.body);
    const result = await configService.updateDiscountLimits(req.auth.companyId, data);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
