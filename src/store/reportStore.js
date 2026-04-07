import { create } from 'zustand';
import reportService from '../services/reportService';

/* ── Helper: build params from filters (strip empty values) ── */
function buildParams(filters) {
  const params = {};
  Object.entries(filters).forEach(([k, v]) => { if (v !== '' && v != null) params[k] = v; });
  return params;
}

/* ── Helper: trigger blob download ── */
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

const useReportStore = create((set, get) => ({
  isLoading: false,
  isExporting: false,

  /* ═══════════════════════════════════
     SALES REPORT
     ═══════════════════════════════════ */
  salesData: [],
  salesStats: null,
  salesChart: null,
  salesPagination: null,
  salesFilters: { page: 1, limit: 20, period: 'monthly', dateFrom: '', dateTo: '', status: '', customerId: '', search: '', sort: '-createdAt' },

  setSalesFilters: (f) =>
    set((s) => ({ salesFilters: { ...s.salesFilters, ...f, page: f.page ?? 1 } })),

  fetchSalesReport: async () => {
    set({ isLoading: true });
    try {
      const params = buildParams(get().salesFilters);
      const { data } = await reportService.getSalesReport(params);
      set({ salesData: data.data, salesPagination: data.meta?.pagination || null, isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  fetchSalesStats: async () => {
    try {
      const params = buildParams(get().salesFilters);
      const { data } = await reportService.getSalesStats(params);
      set({ salesStats: data.data });
    } catch { /* silent */ }
  },

  fetchSalesChart: async () => {
    try {
      const params = buildParams(get().salesFilters);
      const { data } = await reportService.getSalesChart(params);
      set({ salesChart: data.data });
    } catch { /* silent */ }
  },

  exportSalesExcel: async () => {
    set({ isExporting: true });
    try {
      const params = buildParams(get().salesFilters);
      const { data } = await reportService.exportSalesExcel(params);
      downloadBlob(data, `laporan-penjualan-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally { set({ isExporting: false }); }
  },

  exportSalesPdf: async () => {
    set({ isExporting: true });
    try {
      const params = buildParams(get().salesFilters);
      const { data } = await reportService.exportSalesPdf(params);
      downloadBlob(data, `laporan-penjualan-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally { set({ isExporting: false }); }
  },

  /* ═══════════════════════════════════
     PURCHASE REPORT
     ═══════════════════════════════════ */
  purchaseData: [],
  purchaseStats: null,
  purchaseChart: null,
  purchasePagination: null,
  purchaseFilters: { page: 1, limit: 20, period: 'monthly', dateFrom: '', dateTo: '', status: '', supplierId: '', search: '', sort: '-createdAt' },

  setPurchaseFilters: (f) =>
    set((s) => ({ purchaseFilters: { ...s.purchaseFilters, ...f, page: f.page ?? 1 } })),

  fetchPurchaseReport: async () => {
    set({ isLoading: true });
    try {
      const params = buildParams(get().purchaseFilters);
      const { data } = await reportService.getPurchaseReport(params);
      set({ purchaseData: data.data, purchasePagination: data.meta?.pagination || null, isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  fetchPurchaseStats: async () => {
    try {
      const params = buildParams(get().purchaseFilters);
      const { data } = await reportService.getPurchaseStats(params);
      set({ purchaseStats: data.data });
    } catch { /* silent */ }
  },

  fetchPurchaseChart: async () => {
    try {
      const params = buildParams(get().purchaseFilters);
      const { data } = await reportService.getPurchaseChart(params);
      set({ purchaseChart: data.data });
    } catch { /* silent */ }
  },

  exportPurchaseExcel: async () => {
    set({ isExporting: true });
    try {
      const params = buildParams(get().purchaseFilters);
      const { data } = await reportService.exportPurchaseExcel(params);
      downloadBlob(data, `laporan-pembelian-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally { set({ isExporting: false }); }
  },

  exportPurchasePdf: async () => {
    set({ isExporting: true });
    try {
      const params = buildParams(get().purchaseFilters);
      const { data } = await reportService.exportPurchasePdf(params);
      downloadBlob(data, `laporan-pembelian-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally { set({ isExporting: false }); }
  },

  /* ═══════════════════════════════════
     STOCK REPORT
     ═══════════════════════════════════ */
  stockData: [],
  stockStats: null,
  stockChart: null,
  stockPagination: null,
  stockFilters: { page: 1, limit: 20, kategori: '', golongan: '', stockStatus: '', search: '', sort: '-totalStock' },

  setStockFilters: (f) =>
    set((s) => ({ stockFilters: { ...s.stockFilters, ...f, page: f.page ?? 1 } })),

  fetchStockReport: async () => {
    set({ isLoading: true });
    try {
      const params = buildParams(get().stockFilters);
      const { data } = await reportService.getStockReport(params);
      set({ stockData: data.data, stockPagination: data.meta?.pagination || null, isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  fetchStockStats: async () => {
    try {
      const params = buildParams(get().stockFilters);
      const { data } = await reportService.getStockStats(params);
      set({ stockStats: data.data });
    } catch { /* silent */ }
  },

  fetchStockChart: async () => {
    try {
      const params = buildParams(get().stockFilters);
      const { data } = await reportService.getStockChart(params);
      set({ stockChart: data.data });
    } catch { /* silent */ }
  },

  exportStockExcel: async () => {
    set({ isExporting: true });
    try {
      const params = buildParams(get().stockFilters);
      const { data } = await reportService.exportStockExcel(params);
      downloadBlob(data, `laporan-stok-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally { set({ isExporting: false }); }
  },

  exportStockPdf: async () => {
    set({ isExporting: true });
    try {
      const params = buildParams(get().stockFilters);
      const { data } = await reportService.exportStockPdf(params);
      downloadBlob(data, `laporan-stok-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally { set({ isExporting: false }); }
  },

  /* ═══════════════════════════════════
     FINANCE REPORT
     ═══════════════════════════════════ */
  financeData: null,
  financeStats: null,
  financeChart: null,
  financeFilters: { period: 'monthly', dateFrom: '', dateTo: '' },

  setFinanceFilters: (f) =>
    set((s) => ({ financeFilters: { ...s.financeFilters, ...f } })),

  fetchFinanceReport: async () => {
    set({ isLoading: true });
    try {
      const params = buildParams(get().financeFilters);
      const { data } = await reportService.getFinanceReport(params);
      set({ financeData: data.data, isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  fetchFinanceStats: async () => {
    try {
      const params = buildParams(get().financeFilters);
      const { data } = await reportService.getFinanceStats(params);
      set({ financeStats: data.data });
    } catch { /* silent */ }
  },

  fetchFinanceChart: async () => {
    try {
      const params = buildParams(get().financeFilters);
      const { data } = await reportService.getFinanceChart(params);
      set({ financeChart: data.data });
    } catch { /* silent */ }
  },

  exportFinanceExcel: async () => {
    set({ isExporting: true });
    try {
      const params = buildParams(get().financeFilters);
      const { data } = await reportService.exportFinanceExcel(params);
      downloadBlob(data, `laporan-keuangan-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally { set({ isExporting: false }); }
  },

  exportFinancePdf: async () => {
    set({ isExporting: true });
    try {
      const params = buildParams(get().financeFilters);
      const { data } = await reportService.exportFinancePdf(params);
      downloadBlob(data, `laporan-keuangan-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally { set({ isExporting: false }); }
  },

  /* ═══════════════════════════════════
     EXPIRED REPORT
     ═══════════════════════════════════ */
  expiredData: [],
  expiredStats: null,
  expiredChart: null,
  expiredPagination: null,
  expiredFilters: { page: 1, limit: 20, expiryStatus: '', kategori: '', golongan: '', dateFrom: '', dateTo: '', search: '', sort: 'expiryDate' },

  setExpiredFilters: (f) =>
    set((s) => ({ expiredFilters: { ...s.expiredFilters, ...f, page: f.page ?? 1 } })),

  fetchExpiredReport: async () => {
    set({ isLoading: true });
    try {
      const params = buildParams(get().expiredFilters);
      const { data } = await reportService.getExpiredReport(params);
      set({ expiredData: data.data, expiredPagination: data.meta?.pagination || null, isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  fetchExpiredStats: async () => {
    try {
      const params = buildParams(get().expiredFilters);
      const { data } = await reportService.getExpiredStats(params);
      set({ expiredStats: data.data });
    } catch { /* silent */ }
  },

  fetchExpiredChart: async () => {
    try {
      const params = buildParams(get().expiredFilters);
      const { data } = await reportService.getExpiredChart(params);
      set({ expiredChart: data.data });
    } catch { /* silent */ }
  },

  exportExpiredExcel: async () => {
    set({ isExporting: true });
    try {
      const params = buildParams(get().expiredFilters);
      const { data } = await reportService.exportExpiredExcel(params);
      downloadBlob(data, `laporan-expired-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally { set({ isExporting: false }); }
  },

  exportExpiredPdf: async () => {
    set({ isExporting: true });
    try {
      const params = buildParams(get().expiredFilters);
      const { data } = await reportService.exportExpiredPdf(params);
      downloadBlob(data, `laporan-expired-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally { set({ isExporting: false }); }
  },
}));

export default useReportStore;
