import api from '../lib/api';

export const dashboardService = {
  getDashboard: async () => (await api.get('/dashboard')).data,
};

export default dashboardService;
