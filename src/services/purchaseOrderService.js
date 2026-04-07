import apiClient from '../api/axios';

const purchaseOrderService = {
  // Get All POs — GET /purchase-orders
  getAll: (params = {}) =>
    apiClient.get('/purchase-orders', { params }),

  // Get PO Stats — GET /purchase-orders/stats
  getStats: () =>
    apiClient.get('/purchase-orders/stats'),

  // Get PO by ID — GET /purchase-orders/:id
  getById: (id) =>
    apiClient.get(`/purchase-orders/${id}`),

  // Create PO — POST /purchase-orders
  create: (data) =>
    apiClient.post('/purchase-orders', data),

  // Update PO — PUT /purchase-orders/:id
  update: (id, data) =>
    apiClient.put(`/purchase-orders/${id}`, data),

  // Delete PO — DELETE /purchase-orders/:id
  remove: (id) =>
    apiClient.delete(`/purchase-orders/${id}`),

  // Change PO Status — PATCH /purchase-orders/:id/status
  changeStatus: (id, status, notes) =>
    apiClient.patch(`/purchase-orders/${id}/status`, { status, notes }),

  // Approve PO — PATCH /purchase-orders/:id/approve
  approve: (id, notes) =>
    apiClient.patch(`/purchase-orders/${id}/approve`, { notes }),

  // Reject PO — PATCH /purchase-orders/:id/reject
  reject: (id, notes) =>
    apiClient.patch(`/purchase-orders/${id}/reject`, { notes }),
};

export default purchaseOrderService;
