import { create } from 'zustand';
import salesOrderService from '../services/salesOrderService';

const useSalesOrderStore = create((set, get) => ({
  orders: [],
  stats: null,
  pagination: null,
  selectedOrder: null,
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

  fetchOrders: async () => {
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

      const { data } = await salesOrderService.getAll(params);
      set({
        orders: data.data,
        pagination: data.meta?.pagination || null,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchStats: async () => {
    try {
      const { data } = await salesOrderService.getStats();
      set({ stats: data.data });
    } catch {
      // ignore
    }
  },

  fetchOrder: async (id) => {
    try {
      const { data } = await salesOrderService.getById(id);
      set({ selectedOrder: data.data });
      return data.data;
    } catch {
      return null;
    }
  },

  createOrder: async (orderData) => {
    const { data } = await salesOrderService.create(orderData);
    return data;
  },

  updateOrder: async (id, orderData) => {
    const { data } = await salesOrderService.update(id, orderData);
    return data;
  },

  deleteOrder: async (id) => {
    const { data } = await salesOrderService.remove(id);
    return data;
  },

  changeStatus: async (id, status, notes) => {
    const { data } = await salesOrderService.changeStatus(id, status, notes);
    return data;
  },

  clearSelectedOrder: () => set({ selectedOrder: null }),
}));

export default useSalesOrderStore;
