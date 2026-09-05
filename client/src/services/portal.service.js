import api from '../lib/api';

// Customer-facing negotiation + account actions, hitting the already-mounted
// /api/portal/* routes (server/src/routes/portal.routes.js). These were
// previously left unwired on the client — the frontend showed a "not yet
// mounted" placeholder even though the backend has worked the whole time.
export const portalService = {
  // Rep-side negotiation actions — this hits the friend's portal module
  // (portal.routes.js is authenticate-only, no accountType gate, so it works
  // for reps replying just as it does for customers proposing).
  respondToProposal: async (proposalId, action, extra = {}) =>
    (await api.post(`/portal/proposals/${proposalId}/respond`, { action, ...extra })).data,

  // Customer-facing calls below.
  listQuotations: async (status) =>
    (await api.get('/portal/quotations', { params: status ? { status } : {} })).data,

  getQuotation: async (id) =>
    (await api.get(`/portal/quotations/${id}`)).data,

  getProfile: async () =>
    (await api.get('/portal/profile')).data,

  acceptQuotation: async (id) =>
    (await api.post(`/portal/quotations/${id}/accept`)).data,

  confirmQuotation: async (id) =>
    (await api.post(`/portal/quotations/${id}/confirm`)).data,

  createProposal: async (id, data) =>
    (await api.post(`/portal/quotations/${id}/proposals`, data)).data,

  customerAcceptProposal: async (proposalId) =>
    (await api.post(`/portal/proposals/${proposalId}/accept`)).data,

  getOrders: async () =>
    (await api.get('/portal/orders')).data,

  getBilling: async () =>
    (await api.get('/portal/billing')).data,
};

export default portalService;
