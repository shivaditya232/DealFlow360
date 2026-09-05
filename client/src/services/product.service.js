import api from '../lib/api';

export const productService = {
  list: async () => (await api.get('/products')).data,
  create: async (data) => (await api.post('/products', data)).data,
};

export default productService;
