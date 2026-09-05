import * as configService from "../services/config.service.js";

export async function getDiscountLimits(req, res, next) {
  try {
    const result = await configService.getDiscountLimits(req.auth.companyId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
