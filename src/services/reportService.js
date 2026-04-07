import apiClient from '../api/axios';

const reportService = {
  /* ── Sales Report ── */
  getSalesReport: (params = {}) =>
    apiClient.get('/reports/sales', { params }),

  getSalesStats: (params = {}) =>
    apiClient.get('/reports/sales/stats', { params }),

  getSalesChart: (params = {}) =>
    apiClient.get('/reports/sales/chart', { params }),

  exportSalesExcel: (params = {}) =>
    apiClient.get('/reports/sales/export', { params, responseType: 'blob' }),

  exportSalesPdf: (params = {}) =>
    apiClient.get('/reports/sales/pdf', { params, responseType: 'blob' }),

  /* ── Purchase Report ── */
  getPurchaseReport: (params = {}) =>
    apiClient.get('/reports/purchases', { params }),

  getPurchaseStats: (params = {}) =>
    apiClient.get('/reports/purchases/stats', { params }),

  getPurchaseChart: (params = {}) =>
    apiClient.get('/reports/purchases/chart', { params }),

  exportPurchaseExcel: (params = {}) =>
    apiClient.get('/reports/purchases/export', { params, responseType: 'blob' }),

  exportPurchasePdf: (params = {}) =>
    apiClient.get('/reports/purchases/pdf', { params, responseType: 'blob' }),

  /* ── Stock Report ── */
  getStockReport: (params = {}) =>
    apiClient.get('/reports/stock', { params }),

  getStockStats: (params = {}) =>
    apiClient.get('/reports/stock/stats', { params }),

  getStockChart: (params = {}) =>
    apiClient.get('/reports/stock/chart', { params }),

  exportStockExcel: (params = {}) =>
    apiClient.get('/reports/stock/export', { params, responseType: 'blob' }),

  exportStockPdf: (params = {}) =>
    apiClient.get('/reports/stock/pdf', { params, responseType: 'blob' }),

  /* ── Finance Report ── */
  getFinanceReport: (params = {}) =>
    apiClient.get('/reports/finance', { params }),

  getFinanceStats: (params = {}) =>
    apiClient.get('/reports/finance/stats', { params }),

  getFinanceChart: (params = {}) =>
    apiClient.get('/reports/finance/chart', { params }),

  exportFinanceExcel: (params = {}) =>
    apiClient.get('/reports/finance/export', { params, responseType: 'blob' }),

  exportFinancePdf: (params = {}) =>
    apiClient.get('/reports/finance/pdf', { params, responseType: 'blob' }),

  /* ── Expired Report ── */
  getExpiredReport: (params = {}) =>
    apiClient.get('/reports/expired', { params }),

  getExpiredStats: (params = {}) =>
    apiClient.get('/reports/expired/stats', { params }),

  getExpiredChart: (params = {}) =>
    apiClient.get('/reports/expired/chart', { params }),

  exportExpiredExcel: (params = {}) =>
    apiClient.get('/reports/expired/export', { params, responseType: 'blob' }),

  exportExpiredPdf: (params = {}) =>
    apiClient.get('/reports/expired/pdf', { params, responseType: 'blob' }),
};

export default reportService;
