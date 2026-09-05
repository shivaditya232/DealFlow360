import * as dashboardService from "../services/dashboard.service.js";

export async function getDashboard(req, res, next) {
  try {
    const result = await dashboardService.getDashboard(req.auth.companyId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
