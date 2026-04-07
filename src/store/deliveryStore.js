import { create } from 'zustand';
import deliveryService from '../services/deliveryService';

const useDeliveryStore = create((set, get) => ({
  deliveries: [],
  stats: null,
  pagination: null,
  selectedDelivery: null,
  isLoading: false,

  filters: {
    page: 1,
    limit: 10,
    search: '',
    status: '',
    customerId: '',
    dateFrom: '',
    dateTo: '',
    sort: '-createdAt',
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters, page: newFilters.page ?? 1 },
    }));
  },

  fetchDeliveries: async () => {
    set({ isLoading: true });
    try {
      const { filters } = get();
      const params = {};
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.customerId) params.customerId = filters.customerId;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.sort) params.sort = filters.sort;

      const { data } = await deliveryService.getAll(params);
      set({
        deliveries: data.data,
        pagination: data.meta?.pagination || null,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchStats: async () => {
    try {
      const { data } = await deliveryService.getStats();
      set({ stats: data.data });
    } catch {
      // ignore
    }
  },

  fetchDelivery: async (id) => {
    try {
      const { data } = await deliveryService.getById(id);
      set({ selectedDelivery: data.data });
      return data.data;
    } catch {
      return null;
    }
  },

  createDelivery: async (deliveryData) => {
    const { data } = await deliveryService.create(deliveryData);
    return data;
  },

  updateDelivery: async (id, deliveryData) => {
    const { data } = await deliveryService.update(id, deliveryData);
    return data;
  },

  deleteDelivery: async (id) => {
    const { data } = await deliveryService.remove(id);
    return data;
  },

  changeStatus: async (id, status, notes) => {
    const { data } = await deliveryService.changeStatus(id, status, notes);
    return data;
  },

  clearSelectedDelivery: () => set({ selectedDelivery: null }),
}));

export default useDeliveryStore;
