import { create } from 'zustand';
import goodsReceivingService from '../services/goodsReceivingService';

const useGoodsReceivingStore = create((set, get) => ({
  receivings: [],
  stats: null,
  pagination: null,
  selectedReceiving: null,
  isLoading: false,

  filters: {
    page: 1,
    limit: 10,
    search: '',
    status: '',
    supplierId: '',
    dateFrom: '',
    dateTo: '',
    sort: '-createdAt',
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters, page: newFilters.page ?? 1 },
    }));
  },

  fetchReceivings: async () => {
    set({ isLoading: true });
    try {
      const { filters } = get();
      const params = {};
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.supplierId) params.supplierId = filters.supplierId;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.sort) params.sort = filters.sort;

      const { data } = await goodsReceivingService.getAll(params);
      set({
        receivings: data.data,
        pagination: data.meta?.pagination || null,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchStats: async () => {
    try {
      const { data } = await goodsReceivingService.getStats();
      set({ stats: data.data });
    } catch {
      // ignore
    }
  },

  fetchReceiving: async (id) => {
    try {
      const { data } = await goodsReceivingService.getById(id);
      set({ selectedReceiving: data.data });
      return data.data;
    } catch {
      return null;
    }
  },

  createReceiving: async (receivingData) => {
    const { data } = await goodsReceivingService.create(receivingData);
    return data;
  },

  updateReceiving: async (id, receivingData) => {
    const { data } = await goodsReceivingService.update(id, receivingData);
    return data;
  },

  deleteReceiving: async (id) => {
    const { data } = await goodsReceivingService.remove(id);
    return data;
  },

  verifyReceiving: async (id, notes) => {
    const { data } = await goodsReceivingService.verify(id, notes);
    return data;
  },

  clearSelectedReceiving: () => set({ selectedReceiving: null }),
}));

export default useGoodsReceivingStore;
