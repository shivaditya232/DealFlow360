import api from '../lib/api';

export const warehouseService = {
  list: async () => (await api.get('/warehouses')).data,
  create: async (data) => (await api.post('/warehouses', data)).data,
  update: async (id, data) => (await api.patch(`/warehouses/${id}`, data)).data,
  remove: async (id) => (await api.delete(`/warehouses/${id}`)).data,
};

export default warehouseService;
