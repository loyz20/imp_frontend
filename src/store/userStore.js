import { create } from 'zustand';
import userService from '../services/userService';

const useUserStore = create((set, get) => ({
  users: [],
  stats: null,
  pagination: null,
  selectedUser: null,
  isLoading: false,

  filters: {
    page: 1,
    limit: 10,
    search: '',
    role: '',
    isActive: '',
    sort: '-createdAt',
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters, page: newFilters.page ?? 1 },
    }));
  },

  fetchUsers: async () => {
    set({ isLoading: true });
    try {
      const { filters } = get();
      const params = {};
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;
      if (filters.search) params.search = filters.search;
      if (filters.role) params.role = filters.role;
      if (filters.isActive !== '') params.isActive = filters.isActive;
      if (filters.sort) params.sort = filters.sort;

      const { data } = await userService.getAll(params);
      set({
        users: data.data,
        pagination: data.meta?.pagination || null,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchStats: async () => {
    try {
      const { data } = await userService.getStats();
      set({ stats: data.data });
    } catch {
      // ignore
    }
  },

  fetchUser: async (id) => {
    try {
      const { data } = await userService.getById(id);
      set({ selectedUser: data.data });
      return data.data;
    } catch {
      return null;
    }
  },

  createUser: async (userData) => {
    const { data } = await userService.create(userData);
    return data;
  },

  updateUser: async (id, userData) => {
    const { data } = await userService.update(id, userData);
    return data;
  },

  deleteUser: async (id) => {
    const { data } = await userService.remove(id);
    return data;
  },

  changeRole: async (id, role) => {
    const { data } = await userService.changeRole(id, role);
    return data;
  },

  changeStatus: async (id, isActive) => {
    const { data } = await userService.changeStatus(id, isActive);
    return data;
  },

  clearSelectedUser: () => set({ selectedUser: null }),
}));

export default useUserStore;
