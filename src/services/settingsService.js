import apiClient from '../api/axios';

const settingsService = {
    clearData: () => apiClient.post('/admin/clear-data'),
  getAll: () => apiClient.get('/settings'),

  getSection: (section) => apiClient.get(`/settings/${section}`),

  initialize: () => apiClient.post('/settings/initialize'),

  bulkUpdate: (data) => apiClient.put('/settings', data),

  updateCompany: (data) => apiClient.put('/settings/company', data),

  updateLicenses: (data) => apiClient.put('/settings/licenses', data),

  updatePharmacist: (data) => apiClient.put('/settings/pharmacist', data),

  updatePharmacistObat: (data) => apiClient.put('/settings/pharmacist-obat', data),

  updatePharmacistAlkes: (data) => apiClient.put('/settings/pharmacist-alkes', data),

  updateTax: (data) => apiClient.put('/settings/tax', data),

  updateInvoice: (data) => apiClient.put('/settings/invoice', data),

  updatePurchaseOrder: (data) => apiClient.put('/settings/purchase-order', data),

  updateDeliveryOrder: (data) => apiClient.put('/settings/delivery-order', data),

  updateReturnOrder: (data) => apiClient.put('/settings/return-order', data),

  updateInventory: (data) => apiClient.put('/settings/inventory', data),

  updateCdob: (data) => apiClient.put('/settings/cdob', data),

  updateMedication: (data) => apiClient.put('/settings/medication', data),

  updateCustomer: (data) => apiClient.put('/settings/customer', data),

  updatePayment: (data) => apiClient.put('/settings/payment', data),

  updateNotification: (data) => apiClient.put('/settings/notification', data),

  updateReporting: (data) => apiClient.put('/settings/reporting', data),

  updateGeneral: (data) => apiClient.put('/settings/general', data),

  getLicenseWarnings: () => apiClient.get('/settings/license-warnings'),

  testSmtp: (data) => apiClient.post('/settings/test-smtp', data),

  generateDocNumber: (type) => apiClient.post(`/settings/doc-number/${type}`),

  resetDocNumber: (type) => apiClient.put(`/settings/doc-number/${type}/reset`),
};

export default settingsService;
