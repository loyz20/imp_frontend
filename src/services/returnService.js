import apiClient from '../api/axios';

const returnService = {
  // Get All Returns — GET /returns
  getAll: (params = {}) =>
    apiClient.get('/returns', { params }),

  // Get Return Stats — GET /returns/stats
  getStats: () =>
    apiClient.get('/returns/stats'),

  // Get Return by ID — GET /returns/:id
  getById: (id) =>
    apiClient.get(`/returns/${id}`),

  // Create Return — POST /returns
  create: (data) =>
    apiClient.post('/returns', data),

  // Update Return — PUT /returns/:id
  update: (id, data) =>
    apiClient.put(`/returns/${id}`, data),

  // Delete Return — DELETE /returns/:id
  remove: (id) =>
    apiClient.delete(`/returns/${id}`),

  // Change Return Status — PATCH /returns/:id/status
  changeStatus: (id, status, notes) =>
    apiClient.patch(`/returns/${id}/status`, { status, notes }),

  // Get available deliveries for return — GET /returns/available-deliveries
  getAvailableDeliveries: (params = {}) =>
    apiClient.get('/returns/available-deliveries', { params }),
};

export default returnService;
