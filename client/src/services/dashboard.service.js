import api from '../lib/api';

export const dashboardService = {
  getDashboard: async () => (await api.get('/dashboard')).data,
  getStalledDeals: async () => (await api.get('/dashboard/stalled-deals')).data,
  getAnomalies: async () => (await api.get('/dashboard/anomalies')).data,
  getDeliverySlippage: async () => (await api.get('/dashboard/delivery-slippage')).data,
  escalate: async (quotationId) => (await api.post(`/dashboard/escalate/${quotationId}`)).data,
};

export default dashboardService;
