import { create } from 'zustand';
import productService from '../services/productService';

const useProductStore = create((set, get) => ({
  products: [],
  stats: null,
  pagination: null,
  selectedProduct: null,
  batches: [],
  batchSummary: null,
  batchPagination: null,
  isLoading: false,
  exportLoading: false,
  importLoading: false,
  importResult: null,

  filters: {
    page: 1,
    limit: 10,
    search: '',
    category: '',
    golongan: '',
    isActive: '',
    sort: '-createdAt',
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters, page: newFilters.page ?? 1 },
    }));
  },

  fetchProducts: async () => {
    set({ isLoading: true });
    try {
      const { filters } = get();
      const params = {};
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.golongan) params.golongan = filters.golongan;
      if (filters.isActive !== '') params.isActive = filters.isActive;
      if (filters.sort) params.sort = filters.sort;

      const { data } = await productService.getAll(params);
      const productList = Array.isArray(data?.data) ? data.data : [];
      set({
        products: productList,
        pagination: data.meta?.pagination || null,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchStats: async () => {
    try {
      const { data } = await productService.getStats();
      set({ stats: data.data });
    } catch {
      // ignore
    }
  },

  fetchProduct: async (id) => {
    try {
      const { data } = await productService.getById(id);
      set({ selectedProduct: data.data });
      return data.data;
    } catch {
      return null;
    }
  },

  createProduct: async (productData) => {
    const { data } = await productService.create(productData);
    return data;
  },

  updateProduct: async (id, productData) => {
    const { data } = await productService.update(id, productData);
    return data;
  },

  deleteProduct: async (id) => {
    const { data } = await productService.remove(id);
    return data;
  },

  changeStatus: async (id, isActive) => {
    const { data } = await productService.changeStatus(id, isActive);
    return data;
  },

  /* ── Batch (6.8) ── */
  fetchBatches: async (productId, params = {}) => {
    try {
      const { data } = await productService.getBatches(productId, params);
      set({
        batches: data.data,
        batchSummary: data.meta?.summary || null,
        batchPagination: data.meta?.pagination || null,
      });
      return data.data;
    } catch {
      return [];
    }
  },

  /* ── Export (6.9) ── */
  exportProducts: async (params = {}) => {
    set({ exportLoading: true });
    try {
      const response = await productService.exportData(params);
      const disposition = response.headers['content-disposition'];
      const filename = disposition
        ? disposition.split('filename=')[1]?.replace(/"/g, '')
        : `products-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      set({ exportLoading: false });
    } catch {
      set({ exportLoading: false });
      throw new Error('Gagal mengekspor data produk');
    }
  },

  /* ── Import (6.10) ── */
  importProducts: async (file) => {
    set({ importLoading: true, importResult: null });
    try {
      const { data } = await productService.importData(file);
      set({ importResult: data.data, importLoading: false });
      return data.data;
    } catch (err) {
      set({ importLoading: false });
      throw err;
    }
  },

  clearSelectedProduct: () => set({ selectedProduct: null }),
  clearBatches: () => set({ batches: [], batchSummary: null, batchPagination: null }),
  clearImportResult: () => set({ importResult: null }),
}));

export default useProductStore;
