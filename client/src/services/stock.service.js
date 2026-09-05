import api from '../lib/api';

export const stockService = {
  /**
   * Adds stock to a warehouse + product.
   * Triggers automatic backorder consolidation on the backend.
   * @param {{ warehouseId: string, productId: string, quantity: number }} data
   */
  addStock: async ({ warehouseId, productId, quantity }) => {
    const res = await api.post('/stock/add', {
      warehouseId,
      productId,
      quantity: Number(quantity),
    });
    return res.data;
  },
};

export default stockService;
