import { create } from 'zustand';
import returnService from '../services/returnService';

const useReturnStore = create((set, get) => ({
  returns: [],
  stats: null,
  pagination: null,
  selectedReturn: null,
  isLoading: false,

  filters: {
    page: 1,
    limit: 10,
    search: '',
    status: '',
    returnType: '',
    customerId: '',
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

  fetchReturns: async () => {
    set({ isLoading: true });
    try {
      const { filters } = get();
      const params = {};
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.returnType) params.returnType = filters.returnType;
      if (filters.customerId) params.customerId = filters.customerId;
      if (filters.supplierId) params.supplierId = filters.supplierId;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.sort) params.sort = filters.sort;

      const { data } = await returnService.getAll(params);
      set({
        returns: data.data,
        pagination: data.meta?.pagination || null,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchStats: async () => {
    try {
      const { data } = await returnService.getStats();
      set({ stats: data.data });
    } catch {
      // ignore
    }
  },

  fetchReturn: async (id) => {
    try {
      const { data } = await returnService.getById(id);
      set({ selectedReturn: data.data });
      return data.data;
    } catch {
      return null;
    }
  },

  createReturn: async (returnData) => {
    const { data } = await returnService.create(returnData);
    return data;
  },

  updateReturn: async (id, returnData) => {
    const { data } = await returnService.update(id, returnData);
    return data;
  },

  deleteReturn: async (id) => {
    const { data } = await returnService.remove(id);
    return data;
  },

  changeStatus: async (id, status, notes) => {
    const { data } = await returnService.changeStatus(id, status, notes);
    return data;
  },

  clearSelectedReturn: () => set({ selectedReturn: null }),
}));

export default useReturnStore;
