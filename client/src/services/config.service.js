import api from '../lib/api';

export const configService = {
  getDiscountLimits: async () => (await api.get('/config/discount-limits')).data,
};

export default configService;
