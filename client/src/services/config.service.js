import api from '../lib/api';

export const configService = {
  getDiscountLimits: async () => (await api.get('/config/discount-limits')).data,
  updateDiscountLimits: async (data) => (await api.put('/config/discount-limits', data)).data,
};

export default configService;
