import * as dashboardService from "../services/dashboard.service.js";

export async function getDashboard(req, res, next) {
  try {
    const result = await dashboardService.getDashboard(req.auth.companyId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getStalledDeals(req, res, next) {
  try {
    const result = await dashboardService.getStalledDeals(
      req.auth.companyId,
      req.auth.role,
      req.auth.sub
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getAnomalies(req, res, next) {
  try {
    const result = await dashboardService.getAnomalies(
      req.auth.companyId,
      req.auth.role,
      req.auth.sub
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getDeliverySlippage(req, res, next) {
  try {
    const result = await dashboardService.getDeliverySlippage(
      req.auth.companyId,
      req.auth.role,
      req.auth.sub
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function escalate(req, res, next) {
  try {
    const result = await dashboardService.escalate(
      req.auth.companyId,
      req.auth.sub,
      req.params.quotationId
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}
