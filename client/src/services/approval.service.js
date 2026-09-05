import api from '../lib/api';

// Matches the friend's approval.routes.js: list is "pending steps for my
// role" (not full history), and a single POST .../act with an action enum
// handles approve/reject/return. detail() is the additive read endpoint.
export const approvalService = {
  listPending: async () => (await api.get('/approvals')).data,
  detail: async (quotationId) => (await api.get(`/approvals/${quotationId}/detail`)).data,
  act: async (quotationId, action, reason) =>
    (await api.post(`/approvals/${quotationId}/act`, { action, reason })).data,
};

export default approvalService;
