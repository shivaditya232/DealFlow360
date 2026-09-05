import api from '../lib/api';

// Rep-side negotiation actions — this hits the friend's portal module
// (portal.routes.js is authenticate-only, no accountType gate, so it works
// for reps replying just as it does for customers proposing).
export const portalService = {
  respondToProposal: async (proposalId, action, extra = {}) =>
    (await api.post(`/portal/proposals/${proposalId}/respond`, { action, ...extra })).data,
};

export default portalService;
