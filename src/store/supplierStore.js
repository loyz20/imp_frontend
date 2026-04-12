import { create } from 'zustand';
import supplierService from '../services/supplierService';

const useSupplierStore = create((set, get) => ({
  suppliers: [],
  stats: null,
  pagination: null,
  selectedSupplier: null,
  isLoading: false,

  filters: {
    page: 1,
    limit: 10,
    search: '',
    type: '',
    city: '',
    isActive: '',
    sort: '-createdAt',
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters, page: newFilters.page ?? 1 },
    }));
  },

  fetchSuppliers: async () => {
    set({ isLoading: true });
    try {
      const { filters } = get();
      const params = {};
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;
      if (filters.search) params.search = filters.search;
      if (filters.type) params.type = filters.type;
      if (filters.city) params.city = filters.city;
      if (filters.isActive !== '') params.isActive = filters.isActive;
      if (filters.sort) params.sort = filters.sort;

      const { data } = await supplierService.getAll(params);
      const supplierList = Array.isArray(data?.data) ? data.data : [];
      set({
        suppliers: supplierList,
        pagination: data.meta?.pagination || null,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchStats: async () => {
    try {
      const { data } = await supplierService.getStats();
      set({ stats: data.data });
    } catch {
      // ignore
    }
  },

  fetchSupplier: async (id) => {
    try {
      const { data } = await supplierService.getById(id);
      set({ selectedSupplier: data.data });
      return data.data;
    } catch {
      return null;
    }
  },

  createSupplier: async (supplierData) => {
    const { data } = await supplierService.create(supplierData);
    return data;
  },

  updateSupplier: async (id, supplierData) => {
    const { data } = await supplierService.update(id, supplierData);
    return data;
  },

  deleteSupplier: async (id) => {
    const { data } = await supplierService.remove(id);
    return data;
  },

  changeStatus: async (id, isActive) => {
    const { data } = await supplierService.changeStatus(id, isActive);
    return data;
  },

  clearSelectedSupplier: () => set({ selectedSupplier: null }),
}));

export default useSupplierStore;
