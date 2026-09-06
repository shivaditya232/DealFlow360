import api from '../lib/api';

export const productService = {
  list: async () => (await api.get('/products')).data,
  create: async (data) => (await api.post('/products', data)).data,
  update: async (id, data) => (await api.patch(`/products/${id}`, data)).data,
  remove: async (id) => (await api.delete(`/products/${id}`)).data,
};

export default productService;
