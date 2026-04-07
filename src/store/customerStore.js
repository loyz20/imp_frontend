import { create } from 'zustand';
import customerService from '../services/customerService';

const useCustomerStore = create((set, get) => ({
  customers: [],
  stats: null,
  pagination: null,
  selectedCustomer: null,
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

  fetchCustomers: async () => {
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

      const { data } = await customerService.getAll(params);
      set({
        customers: data.data,
        pagination: data.meta?.pagination || null,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchStats: async () => {
    try {
      const { data } = await customerService.getStats();
      set({ stats: data.data });
    } catch {
      // ignore
    }
  },

  fetchCustomer: async (id) => {
    try {
      const { data } = await customerService.getById(id);
      set({ selectedCustomer: data.data });
      return data.data;
    } catch {
      return null;
    }
  },

  createCustomer: async (customerData) => {
    const { data } = await customerService.create(customerData);
    return data;
  },

  updateCustomer: async (id, customerData) => {
    const { data } = await customerService.update(id, customerData);
    return data;
  },

  deleteCustomer: async (id) => {
    const { data } = await customerService.remove(id);
    return data;
  },

  changeStatus: async (id, isActive) => {
    const { data } = await customerService.changeStatus(id, isActive);
    return data;
  },

  clearSelectedCustomer: () => set({ selectedCustomer: null }),
}));

export default useCustomerStore;
