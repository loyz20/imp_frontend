import apiClient from '../api/axios';

const supplierService = {
  // Get All Suppliers — GET /suppliers
  getAll: (params = {}) =>
    apiClient.get('/suppliers', { params }),

  // Get Supplier Stats — GET /suppliers/stats
  getStats: () =>
    apiClient.get('/suppliers/stats'),

  // Get Supplier by ID — GET /suppliers/:id
  getById: (id) =>
    apiClient.get(`/suppliers/${id}`),

  // Create Supplier — POST /suppliers
  create: (data) =>
    apiClient.post('/suppliers', data),

  // Update Supplier — PUT /suppliers/:id
  update: (id, data) =>
    apiClient.put(`/suppliers/${id}`, data),

  // Delete Supplier — DELETE /suppliers/:id
  remove: (id) =>
    apiClient.delete(`/suppliers/${id}`),

  // Change Supplier Status — PATCH /suppliers/:id/status
  changeStatus: (id, isActive) =>
    apiClient.patch(`/suppliers/${id}/status`, { isActive }),
};

export default supplierService;
