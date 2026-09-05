import api from '../lib/api';

export const customerService = {
  list: async () => (await api.get('/customers')).data,
  create: async (data) => (await api.post('/customers', data)).data,
};

export default customerService;
