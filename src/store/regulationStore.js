import { create } from 'zustand';
import regulationService from '../services/regulationService';

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

const useRegulationStore = create((set, get) => ({
  /* ═══ Loading ═══ */
  isLoading: false,

  /* ═══════════════════════════════════
     SURAT PESANAN KHUSUS
     ═══════════════════════════════════ */
  spList: [],
  spStats: null,
  spPagination: null,
  spFilters: { page: 1, limit: 20, type: '', status: '', search: '' },

  setSPFilters: (f) =>
    set((s) => ({ spFilters: { ...s.spFilters, ...f, page: f.page ?? 1 } })),

  fetchSPList: async () => {
    set({ isLoading: true });
    try {
      const params = {};
      const f = get().spFilters;
      Object.entries(f).forEach(([k, v]) => { if (v !== '' && v != null) params[k] = v; });
      const { data } = await regulationService.getSPList(params);
      set({ spList: data.data || [], spPagination: data.meta?.pagination || null });
    } catch { /* silent */ }
    set({ isLoading: false });
  },

  fetchSPStats: async () => {
    try {
      const { data } = await regulationService.getSPStats();
      set({ spStats: data.data || null });
    } catch { /* silent */ }
  },

  createSP: async (payload) => {
    const { data } = await regulationService.createSP(payload);
    return data.data;
  },

  updateSPStatus: async (id, status) => {
    const { data } = await regulationService.updateSPStatus(id, status);
    return data.data;
  },

  exportSPPdf: async (id, spNumber) => {
    const { data } = await regulationService.exportSPPdf(id);
    downloadBlob(data, `${spNumber || 'surat-pesanan'}.pdf`);
  },

  /* ═══════════════════════════════════
     E-REPORT BPOM
     ═══════════════════════════════════ */
  eReports: [],
  eReportStats: null,
  eReportPagination: null,
  eReportFilters: { page: 1, limit: 20, type: '', status: '' },
  generatedReport: null,

  setEReportFilters: (f) =>
    set((s) => ({ eReportFilters: { ...s.eReportFilters, ...f, page: f.page ?? 1 } })),

  fetchEReports: async () => {
    set({ isLoading: true });
    try {
      const params = {};
      const f = get().eReportFilters;
      Object.entries(f).forEach(([k, v]) => { if (v !== '' && v != null) params[k] = v; });
      const { data } = await regulationService.getEReports(params);
      set({ eReports: data.data || [], eReportPagination: data.meta?.pagination || null });
    } catch { /* silent */ }
    set({ isLoading: false });
  },

  fetchEReportStats: async () => {
    try {
      const { data } = await regulationService.getEReportStats();
      set({ eReportStats: data.data || null });
    } catch { /* silent */ }
  },

  generateEReport: async (payload) => {
    set({ isLoading: true });
    try {
      const { data } = await regulationService.generateEReport(payload);
      set({ generatedReport: data.data || null });
    } catch { /* silent */ }
    set({ isLoading: false });
  },

  submitEReport: async (id) => {
    const { data } = await regulationService.submitEReport(id);
    return data.data;
  },

  exportEReportPdf: async (period, type) => {
    const { data } = await regulationService.exportEReportPdf({ period, type });
    downloadBlob(data, `ereport-${type}-${period}.pdf`);
  },

  clearGeneratedReport: () => set({ generatedReport: null }),

  /* ═══════════════════════════════════
     DOKUMEN PERIZINAN
     ═══════════════════════════════════ */
  documents: null,
  docStats: null,

  fetchDocuments: async () => {
    set({ isLoading: true });
    try {
      const { data } = await regulationService.getDocuments();
      set({ documents: data.data || null });
    } catch { /* silent */ }
    set({ isLoading: false });
  },

  fetchDocStats: async () => {
    try {
      const { data } = await regulationService.getDocStats();
      set({ docStats: data.data || null });
    } catch { /* silent */ }
  },

  uploadDocument: async (id, file) => {
    const { data } = await regulationService.uploadDocument(id, file);
    return data.data;
  },
}));

export default useRegulationStore;
