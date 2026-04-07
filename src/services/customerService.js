import apiClient from '../api/axios';

const customerService = {
  // Get All Customers — GET /customers
  getAll: (params = {}) =>
    apiClient.get('/customers', { params }),

  // Get Customer Stats — GET /customers/stats
  getStats: () =>
    apiClient.get('/customers/stats'),

  // Get Customer by ID — GET /customers/:id
  getById: (id) =>
    apiClient.get(`/customers/${id}`),

  // Create Customer — POST /customers
  create: (data) =>
    apiClient.post('/customers', data),

  // Update Customer — PUT /customers/:id
  update: (id, data) =>
    apiClient.put(`/customers/${id}`, data),

  // Delete Customer — DELETE /customers/:id
  remove: (id) =>
    apiClient.delete(`/customers/${id}`),

  // Change Customer Status — PATCH /customers/:id/status
  changeStatus: (id, isActive) =>
    apiClient.patch(`/customers/${id}/status`, { isActive }),
};

export default customerService;
