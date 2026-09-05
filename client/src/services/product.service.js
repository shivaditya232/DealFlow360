import api from '../lib/api';

export const productService = {
  list: async () => (await api.get('/products')).data,
};

export default productService;
