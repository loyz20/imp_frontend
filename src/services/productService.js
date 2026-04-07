import apiClient from '../api/axios';

const productService = {
  // 6.1 Get All Products — GET /products
  getAll: (params = {}) =>
    apiClient.get('/products', { params }),

  // 6.2 Get Product Stats — GET /products/stats
  getStats: () =>
    apiClient.get('/products/stats'),

  // 6.3 Get Product by ID — GET /products/:id (includes stockSummary, createdBy, updatedBy)
  getById: (id) =>
    apiClient.get(`/products/${id}`),

  // 6.4 Create Product — POST /products
  create: (data) =>
    apiClient.post('/products', data),

  // 6.5 Update Product — PUT /products/:id
  update: (id, data) =>
    apiClient.put(`/products/${id}`, data),

  // 6.6 Delete Product — DELETE /products/:id (soft delete)
  remove: (id) =>
    apiClient.delete(`/products/${id}`),

  // 6.7 Change Product Status — PATCH /products/:id/status
  changeStatus: (id, isActive) =>
    apiClient.patch(`/products/${id}/status`, { isActive }),

  // 6.8 Get Product Batches — GET /products/:id/batches (FEFO sorted)
  getBatches: (id, params = {}) =>
    apiClient.get(`/products/${id}/batches`, { params }),

  // 6.9 Export Products — GET /products/export (binary blob)
  exportData: (params = {}) =>
    apiClient.get('/products/export', { params, responseType: 'blob' }),

  // 6.10 Import Products — POST /products/import (multipart/form-data)
  importData: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/products/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default productService;
