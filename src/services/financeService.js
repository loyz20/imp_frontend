import apiClient from '../api/axios';

const financeService = {
  /* ── Dashboard ── */
  getDashboardStats: () =>
    apiClient.get('/finance/dashboard/stats'),

  getDashboardChart: (params = {}) =>
    apiClient.get('/finance/dashboard/chart', { params }),

  /* ── Accounts Receivable (Piutang) ── */
  getReceivables: (params = {}) =>
    apiClient.get('/finance/receivables', { params }),

  createReceivablePayment: (data) =>
    apiClient.post('/finance/receivables', data),

  payReceivable: (id, data) =>
    apiClient.post(`/finance/receivables/${id}/pay`, data),

  getReceivableDetail: (customerId) =>
    apiClient.get(`/finance/receivables/${customerId}`),

  /* ── Accounts Payable (Hutang) ── */
  getPayables: (params = {}) =>
    apiClient.get('/finance/payables', { params }),

  createPayablePayment: (data) =>
    apiClient.post('/finance/payables', data),

  payPayable: (id, data) =>
    apiClient.post(`/finance/payables/${id}/pay`, data),

  getPayableDetail: (supplierId) =>
    apiClient.get(`/finance/payables/${supplierId}`),

  /* ── Payments (Pembayaran) ── */
  getPayments: (params = {}) =>
    apiClient.get('/finance/payments', { params }),

  getPaymentStats: () =>
    apiClient.get('/finance/payments/stats'),

  getPaymentById: (id) =>
    apiClient.get(`/finance/payments/${id}`),

  createPayment: (data) =>
    apiClient.post('/finance/payments', data),

  updatePayment: (id, data) =>
    apiClient.put(`/finance/payments/${id}`, data),

  deletePayment: (id) =>
    apiClient.delete(`/finance/payments/${id}`),

  verifyPayment: (id, notes) =>
    apiClient.patch(`/finance/payments/${id}/verify`, { notes }),

  /* ── Invoice / Faktur ── */
  getInvoices: (params = {}) =>
    apiClient.get('/finance/invoices', { params }),

  getSalesInvoices: (params = {}) =>
    apiClient.get('/finance/invoices/sales', { params }),

  getPurchaseInvoices: (params = {}) =>
    apiClient.get('/finance/invoices/purchase', { params }),

  getInvoiceStats: (params = {}) =>
    apiClient.get('/finance/invoices/stats', { params }),

  getInvoiceById: (id) =>
    apiClient.get(`/finance/invoices/${id}`),

  sendInvoice: (id) =>
    apiClient.patch(`/finance/invoices/${id}/send`),

  cancelInvoice: (id, reason) =>
    apiClient.patch(`/finance/invoices/${id}/cancel`, { reason }),

  uploadInvoiceDocument: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/finance/invoices/${id}/upload-document`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /* ── Credit / Debit Memo ── */
  getMemos: (params = {}) =>
    apiClient.get('/finance/memos', { params }),

  getMemoStats: () =>
    apiClient.get('/finance/memos/stats'),

  getMemoById: (id) =>
    apiClient.get(`/finance/memos/${id}`),

  createMemo: (data) =>
    apiClient.post('/finance/memos', data),

  updateMemo: (id, data) =>
    apiClient.put(`/finance/memos/${id}`, data),

  deleteMemo: (id) =>
    apiClient.delete(`/finance/memos/${id}`),

  approveMemo: (id, notes) =>
    apiClient.patch(`/finance/memos/${id}/approve`, { notes }),

  /* ── General Ledger ── */
  getChartOfAccounts: (params = {}) =>
    apiClient.get('/finance/gl/accounts', { params }),

  checkAccountCodeUnique: (code, excludeId) =>
    apiClient.get('/finance/gl/accounts/check-code', { params: { code, excludeId } }),

  createAccount: (data) =>
    apiClient.post('/finance/gl/accounts', data),

  updateAccount: (id, data) =>
    apiClient.put(`/finance/gl/accounts/${id}`, data),

  toggleAccountActive: (id, isActive) =>
    apiClient.patch(`/finance/gl/accounts/${id}/activate`, { isActive }),

  deleteAccount: (id) =>
    apiClient.delete(`/finance/gl/accounts/${id}`),

  getAccountAuditLogs: (id, params = {}) =>
    apiClient.get(`/finance/gl/accounts/${id}/audit-logs`, { params }),

  importChartOfAccounts: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/finance/gl/accounts/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  exportChartOfAccounts: (params = {}) =>
    apiClient.get('/finance/gl/accounts/export', { params, responseType: 'blob' }),

  getJournalEntries: (params = {}) =>
    apiClient.get('/finance/gl/journals', { params }),

  getTrialBalance: (params = {}) =>
    apiClient.get('/finance/gl/trial-balance', { params }),

  /* ── Bank Reconciliation ── */
  getBankTransactions: (params = {}) =>
    apiClient.get('/finance/bank-transactions', { params }),

  getReconSummary: (params = {}) =>
    apiClient.get('/finance/bank-transactions/summary', { params }),

  createBankTransaction: (data) =>
    apiClient.post('/finance/bank-transactions', data),

  updateBankTransaction: (id, data) =>
    apiClient.put(`/finance/bank-transactions/${id}`, data),

  deleteBankTransaction: (id) =>
    apiClient.delete(`/finance/bank-transactions/${id}`),

  matchTransaction: (bankTransactionId, paymentId) =>
    apiClient.patch(`/finance/bank-transactions/${bankTransactionId}/match`, { paymentId }),

  unmatchTransaction: (bankTransactionId) =>
    apiClient.patch(`/finance/bank-transactions/${bankTransactionId}/unmatch`),
};

export default financeService;
