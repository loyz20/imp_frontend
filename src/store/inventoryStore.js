import { create } from 'zustand';
import inventoryService from '../services/inventoryService';

const useInventoryStore = create((set, get) => ({
  /* ═══════ Stok Gudang ═══════ */
  stocks: [],
  stockStats: null,
  stockPagination: null,
  stockLoading: false,
  stockFilters: {
    page: 1, limit: 10, search: '', kategori: '', golongan: '',
    stockStatus: '', suhuPenyimpanan: '', sort: '-totalStock',
  },

  setStockFilters: (newFilters) => {
    set((s) => ({ stockFilters: { ...s.stockFilters, ...newFilters } }));
  },

  fetchStocks: async () => {
    set({ stockLoading: true });
    try {
      const res = await inventoryService.getStock(get().stockFilters);
      set({
        stocks: res.data.data || [],
        stockPagination: res.data.meta?.pagination || null,
      });
    } catch { /* empty */ } finally {
      set({ stockLoading: false });
    }
  },

  fetchStockStats: async () => {
    try {
      const res = await inventoryService.getStockStats();
      set({ stockStats: res.data.data || null });
    } catch { /* empty */ }
  },

  /* ═══════ Batch detail (for modal) ═══════ */
  batches: [],
  batchProduct: null,
  batchLoading: false,

  fetchBatches: async (productId, params = {}) => {
    set({ batchLoading: true, batches: [], batchProduct: null });
    try {
      const res = await inventoryService.getProductBatches(productId, params);
      set({
        batches: res.data.data || [],
        batchProduct: res.data.meta?.product || null,
      });
    } catch { /* empty */ } finally {
      set({ batchLoading: false });
    }
  },

  /* ═══════ Mutasi Stok ═══════ */
  mutations: [],
  mutationStats: null,
  mutationPagination: null,
  mutationLoading: false,
  mutationFilters: {
    page: 1, limit: 10, search: '', type: '', productId: '',
    dateFrom: '', dateTo: '', sort: 'mutationDate',
  },

  setMutationFilters: (newFilters) => {
    set((s) => ({ mutationFilters: { ...s.mutationFilters, ...newFilters } }));
  },

  fetchMutations: async () => {
    set({ mutationLoading: true });
    try {
      const res = await inventoryService.getMutations(get().mutationFilters);
      set({
        mutations: res.data.data || [],
        mutationPagination: res.data.meta?.pagination || null,
      });
    } catch { /* empty */ } finally {
      set({ mutationLoading: false });
    }
  },

  fetchMutationStats: async () => {
    try {
      const res = await inventoryService.getMutationStats();
      set({ mutationStats: res.data.data || null });
    } catch { /* empty */ }
  },

  createMutation: async (data) => {
    const res = await inventoryService.createMutation(data);
    return res.data;
  },

  /* ═══════ Stok Opname ═══════ */
  opnames: [],
  opnameStats: null,
  opnamePagination: null,
  opnameLoading: false,
  selectedOpname: null,
  opnameFilters: {
    page: 1, limit: 10, search: '', status: '',
    dateFrom: '', dateTo: '', sort: '-createdAt',
  },

  setOpnameFilters: (newFilters) => {
    set((s) => ({ opnameFilters: { ...s.opnameFilters, ...newFilters } }));
  },

  fetchOpnames: async () => {
    set({ opnameLoading: true });
    try {
      const res = await inventoryService.getOpnames(get().opnameFilters);
      set({
        opnames: res.data.data || [],
        opnamePagination: res.data.meta?.pagination || null,
      });
    } catch { /* empty */ } finally {
      set({ opnameLoading: false });
    }
  },

  fetchOpnameStats: async () => {
    try {
      const res = await inventoryService.getOpnameStats();
      set({ opnameStats: res.data.data || null });
    } catch { /* empty */ }
  },

  fetchOpname: async (id) => {
    const res = await inventoryService.getOpnameById(id);
    set({ selectedOpname: res.data.data || null });
    return res.data;
  },

  createOpname: async (data) => {
    const res = await inventoryService.createOpname(data);
    return res.data;
  },

  updateOpname: async (id, data) => {
    const res = await inventoryService.updateOpname(id, data);
    return res.data;
  },

  finalizeOpname: async (id, notes) => {
    const res = await inventoryService.finalizeOpname(id, notes);
    return res.data;
  },

  /* ═══════ Kartu Stok ═══════ */
  stockCard: null,
  stockCardLoading: false,
  stockCardFilters: { page: 1, limit: 50, dateFrom: '', dateTo: '', type: '' },

  setStockCardFilters: (newFilters) => {
    set((s) => ({ stockCardFilters: { ...s.stockCardFilters, ...newFilters } }));
  },

  stockCardPagination: null,

  fetchStockCard: async (productId) => {
    set({ stockCardLoading: true, stockCard: null, stockCardPagination: null });
    try {
      const res = await inventoryService.getStockCard(productId, get().stockCardFilters);
      const data = res.data.data || null;
      set({
        stockCard: data,
        stockCardPagination: data?.pagination || res.data.meta?.pagination || null,
      });
    } catch { /* empty */ } finally {
      set({ stockCardLoading: false });
    }
  },

  /* ═══════ Expired / ED ═══════ */
  expiredItems: [],
  expiredStats: null,
  expiredPagination: null,
  expiredLoading: false,
  expiredFilters: {
    page: 1, limit: 10, search: '', expiryStatus: '',
    kategori: '', storageCondition: '', sort: 'expiryDate',
  },

  setExpiredFilters: (newFilters) => {
    set((s) => ({ expiredFilters: { ...s.expiredFilters, ...newFilters } }));
  },

  fetchExpired: async () => {
    set({ expiredLoading: true });
    try {
      const res = await inventoryService.getExpired(get().expiredFilters);
      set({
        expiredItems: res.data.data || [],
        expiredPagination: res.data.meta?.pagination || null,
      });
    } catch { /* empty */ } finally {
      set({ expiredLoading: false });
    }
  },

  fetchExpiredStats: async () => {
    try {
      const res = await inventoryService.getExpiredStats();
      set({ expiredStats: res.data.data || null });
    } catch { /* empty */ }
  },
}));

export default useInventoryStore;
