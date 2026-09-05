import { approvalActSchema } from "../validators/approval.validator.js";
import * as approvalService from "../services/approval.service.js";

export async function listPendingApprovals(req, res, next) {
  try {
    const { sub: approverId, companyId, role } = req.auth;
    const result = await approvalService.listPendingApprovals(approverId, companyId, role);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function actOnApproval(req, res, next) {
  try {
    const { sub: approverId, companyId } = req.auth;
    const data = approvalActSchema.parse(req.body);
    const result = await approvalService.actOnApproval(
      approverId,
      companyId,
      req.params.quotationId,
      data
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}
