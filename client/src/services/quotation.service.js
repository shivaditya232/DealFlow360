import api from '../lib/api';

export const quotationService = {
  list: async (status) => (await api.get('/quotations', { params: status ? { status } : {} })).data,
  create: async (customerId) => (await api.post('/quotations', { customerId })).data,
  detail: async (id) => (await api.get(`/quotations/${id}`)).data,
  addLine: async (id, data) => (await api.post(`/quotations/${id}/lines`, data)).data,
  updateLine: async (id, lineId, data) => (await api.patch(`/quotations/${id}/lines/${lineId}`, data)).data,
  deleteLine: async (id, lineId) => (await api.delete(`/quotations/${id}/lines/${lineId}`)).data,
  upsellSuggestions: async (id) => (await api.get(`/quotations/${id}/upsell-suggestions`)).data,
  submit: async (id) => (await api.post(`/quotations/${id}/submit`)).data,
};

export default quotationService;
