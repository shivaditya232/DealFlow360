import api from '../lib/api';

export const reportService = {
  /**
   * Fetches JSON report data for table display
   */
  getReportData: async (filters = {}) => {
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
    );
    const res = await api.get('/reports/quotations', {
      params: { ...cleanFilters, format: 'json' },
    });
    return res.data?.data || [];
  },

  /**
   * Downloads a PDF or Excel report file
   */
  downloadReport: async (filters = {}, format = 'pdf') => {
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
    );
    const response = await api.get('/reports/quotations', {
      params: { ...cleanFilters, format },
      responseType: 'blob',
    });

    const blob = new Blob([response.data], {
      type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dealflow360-report-${Date.now()}.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default reportService;
