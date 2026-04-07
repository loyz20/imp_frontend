import { create } from 'zustand';
import financeService from '../services/financeService';

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

const useFinanceStore = create((set, get) => ({
  /* ── Shared ── */
  isLoading: false,

  /* ── Dashboard ── */
  dashboardStats: null,
  chartData: null,

  fetchDashboardStats: async () => {
    try {
      const { data } = await financeService.getDashboardStats();
      set({ dashboardStats: data.data });
    } catch { /* silent */ }
  },

  fetchDashboardChart: async (params) => {
    try {
      const { data } = await financeService.getDashboardChart(params);
      set({ chartData: data.data });
    } catch { /* silent */ }
  },

  /* ── Receivables (Piutang) ── */
  receivables: [],
  receivablePagination: null,
  receivableFilters: { page: 1, limit: 10, search: '', aging: '', dateFrom: '', dateTo: '', sort: '-totalOutstanding' },

  setReceivableFilters: (f) =>
    set((s) => ({ receivableFilters: { ...s.receivableFilters, ...f, page: f.page ?? 1 } })),

  fetchReceivables: async () => {
    set({ isLoading: true });
    try {
      const { receivableFilters: f } = get();
      const params = {};
      Object.entries(f).forEach(([k, v]) => { if (v) params[k] = v; });
      const { data } = await financeService.getReceivables(params);
      set({ receivables: data.data, receivablePagination: data.meta?.pagination || null, isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  createReceivablePayment: async (payload) => {
    const { data } = await financeService.createReceivablePayment(payload);
    return data;
  },

  payReceivable: async (id, payload) => {
    const { data } = await financeService.payReceivable(id, payload);
    return data;
  },

  /* ── Payables (Hutang) ── */
  payables: [],
  payablePagination: null,
  payableFilters: { page: 1, limit: 10, search: '', aging: '', dateFrom: '', dateTo: '', sort: '-totalOutstanding' },

  setPayableFilters: (f) =>
    set((s) => ({ payableFilters: { ...s.payableFilters, ...f, page: f.page ?? 1 } })),

  fetchPayables: async () => {
    set({ isLoading: true });
    try {
      const { payableFilters: f } = get();
      const params = {};
      Object.entries(f).forEach(([k, v]) => { if (v) params[k] = v; });
      const { data } = await financeService.getPayables(params);
      set({ payables: data.data, payablePagination: data.meta?.pagination || null, isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  createPayablePayment: async (payload) => {
    const { data } = await financeService.createPayablePayment(payload);
    return data;
  },

  payPayable: async (id, payload) => {
    const { data } = await financeService.payPayable(id, payload);
    return data;
  },

  /* ── Payments ── */
  payments: [],
  paymentStats: null,
  paymentPagination: null,
  paymentFilters: { page: 1, limit: 10, search: '', type: '', sourceType: '', status: '', dateFrom: '', dateTo: '', sort: '-createdAt' },

  setPaymentFilters: (f) =>
    set((s) => ({ paymentFilters: { ...s.paymentFilters, ...f, page: f.page ?? 1 } })),

  fetchPayments: async () => {
    set({ isLoading: true });
    try {
      const { paymentFilters: f } = get();
      const params = {};
      Object.entries(f).forEach(([k, v]) => { if (v) params[k] = v; });
      const { data } = await financeService.getPayments(params);
      set({ payments: data.data, paymentPagination: data.meta?.pagination || null, isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  fetchPaymentStats: async () => {
    try {
      const { data } = await financeService.getPaymentStats();
      set({ paymentStats: data.data });
    } catch { /* silent */ }
  },

  createPayment: async (payload) => {
    const { data } = await financeService.createPayment(payload);
    return data;
  },

  updatePayment: async (id, payload) => {
    const { data } = await financeService.updatePayment(id, payload);
    return data;
  },

  deletePayment: async (id) => {
    await financeService.deletePayment(id);
  },

  verifyPayment: async (id, notes) => {
    const { data } = await financeService.verifyPayment(id, notes);
    return data;
  },

  /* ── Invoices ── */
  invoices: [],
  invoiceStats: null,
  invoicePagination: null,
  invoiceFilters: { page: 1, limit: 10, invoiceType: 'sales', search: '', status: '', customerId: '', dateFrom: '', dateTo: '', overdue: '', sort: '-createdAt' },

  setInvoiceFilters: (f) =>
    set((s) => ({ invoiceFilters: { ...s.invoiceFilters, ...f, page: f.page ?? 1 } })),

  fetchInvoices: async () => {
    set({ isLoading: true });
    try {
      const { invoiceFilters: f } = get();
      const invoiceType = f.invoiceType || 'sales';
      const params = {};
      Object.entries(f).forEach(([k, v]) => {
        if (k !== 'invoiceType' && v) params[k] = v;
      });
      const { data } = invoiceType === 'purchase'
        ? await financeService.getPurchaseInvoices(params)
        : await financeService.getSalesInvoices(params);
      set({ invoices: data.data, invoicePagination: data.meta?.pagination || null, isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  fetchInvoiceStats: async () => {
    try {
      const { invoiceFilters: f } = get();
      const invoiceType = f.invoiceType || 'sales';
      const { data } = await financeService.getInvoiceStats({ invoiceType, type: invoiceType });
      set({ invoiceStats: data.data });
    } catch { /* silent */ }
  },

  sendInvoice: async (id) => {
    const { data } = await financeService.sendInvoice(id);
    return data;
  },

  cancelInvoice: async (id, reason) => {
    const { data } = await financeService.cancelInvoice(id, reason);
    return data;
  },

  /* ── Memos ── */
  memos: [],
  memoStats: null,
  memoPagination: null,
  memoFilters: { page: 1, limit: 10, search: '', type: '', status: '', dateFrom: '', dateTo: '', sort: '-createdAt' },

  setMemoFilters: (f) =>
    set((s) => ({ memoFilters: { ...s.memoFilters, ...f, page: f.page ?? 1 } })),

  fetchMemos: async () => {
    set({ isLoading: true });
    try {
      const { memoFilters: f } = get();
      const params = {};
      Object.entries(f).forEach(([k, v]) => { if (v) params[k] = v; });
      const { data } = await financeService.getMemos(params);
      set({ memos: data.data, memoPagination: data.meta?.pagination || null, isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  fetchMemoStats: async () => {
    try {
      const { data } = await financeService.getMemoStats();
      set({ memoStats: data.data });
    } catch { /* silent */ }
  },

  createMemo: async (payload) => {
    const { data } = await financeService.createMemo(payload);
    return data;
  },

  updateMemo: async (id, payload) => {
    const { data } = await financeService.updateMemo(id, payload);
    return data;
  },

  deleteMemo: async (id) => {
    await financeService.deleteMemo(id);
  },

  approveMemo: async (id, notes) => {
    const { data } = await financeService.approveMemo(id, notes);
    return data;
  },

  /* ── General Ledger ── */
  accounts: [],
  accountAuditLogs: [],
  journalEntries: [],
  journalPagination: null,
  trialBalance: [],
  glFilters: { page: 1, limit: 20, dateFrom: '', dateTo: '', accountCategory: '', search: '', sort: '-date' },

  setGlFilters: (f) =>
    set((s) => ({ glFilters: { ...s.glFilters, ...f, page: f.page ?? 1 } })),

  fetchAccounts: async () => {
    try {
      const { data } = await financeService.getChartOfAccounts();
      set({ accounts: data.data });
    } catch { /* silent */ }
  },

  checkAccountCodeUnique: async (code, excludeId) => {
    try {
      const { data } = await financeService.checkAccountCodeUnique(code, excludeId);
      return data?.data?.isUnique ?? data?.isUnique ?? true;
    } catch {
      return null;
    }
  },

  createAccount: async (payload) => {
    const { data } = await financeService.createAccount(payload);
    return data;
  },

  updateAccount: async (id, payload) => {
    const { data } = await financeService.updateAccount(id, payload);
    return data;
  },

  toggleAccountActive: async (id, isActive) => {
    const { data } = await financeService.toggleAccountActive(id, isActive);
    return data;
  },

  deleteAccount: async (id) => {
    const { data } = await financeService.deleteAccount(id);
    return data;
  },

  fetchAccountAuditLogs: async (id, params = {}) => {
    const { data } = await financeService.getAccountAuditLogs(id, params);
    set({ accountAuditLogs: data.data || [] });
    return data.data || [];
  },

  importChartOfAccounts: async (file) => {
    const { data } = await financeService.importChartOfAccounts(file);
    return data;
  },

  exportChartOfAccounts: async (params = {}) => {
    const { data } = await financeService.exportChartOfAccounts(params);
    downloadBlob(data, `chart-of-accounts-${new Date().toISOString().slice(0, 10)}.xlsx`);
  },

  fetchJournalEntries: async () => {
    set({ isLoading: true });
    try {
      const { glFilters: f } = get();
      const params = {};
      Object.entries(f).forEach(([k, v]) => { if (v) params[k] = v; });
      const { data } = await financeService.getJournalEntries(params);
      set({ journalEntries: data.data, journalPagination: data.meta?.pagination || null, isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  fetchTrialBalance: async (params = {}) => {
    try {
      const { data } = await financeService.getTrialBalance(params);
      set({ trialBalance: data.data });
    } catch { /* silent */ }
  },

  /* ── Bank Reconciliation ── */
  bankTransactions: [],
  bankPagination: null,
  reconSummary: null,
  bankFilters: { page: 1, limit: 20, search: '', matchStatus: '', dateFrom: '', dateTo: '', sort: '-date' },

  setBankFilters: (f) =>
    set((s) => ({ bankFilters: { ...s.bankFilters, ...f, page: f.page ?? 1 } })),

  fetchBankTransactions: async () => {
    set({ isLoading: true });
    try {
      const { bankFilters: f } = get();
      const params = {};
      Object.entries(f).forEach(([k, v]) => { if (v) params[k] = v; });
      const { data } = await financeService.getBankTransactions(params);
      set({ bankTransactions: data.data, bankPagination: data.meta?.pagination || null, isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  fetchReconSummary: async (params = {}) => {
    try {
      const { data } = await financeService.getReconSummary(params);
      set({ reconSummary: data.data });
    } catch { /* silent */ }
  },

  createBankTransaction: async (payload) => {
    const { data } = await financeService.createBankTransaction(payload);
    return data;
  },

  updateBankTransaction: async (id, payload) => {
    const { data } = await financeService.updateBankTransaction(id, payload);
    return data;
  },

  deleteBankTransaction: async (id) => {
    await financeService.deleteBankTransaction(id);
  },

  matchTransaction: async (bankTxId, paymentId) => {
    const { data } = await financeService.matchTransaction(bankTxId, paymentId);
    return data;
  },

  unmatchTransaction: async (bankTxId) => {
    const { data } = await financeService.unmatchTransaction(bankTxId);
    return data;
  },
}));

export default useFinanceStore;
