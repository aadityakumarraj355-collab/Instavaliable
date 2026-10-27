import api from './api'

export const whatsAppService = {
  // Public
  getActiveContacts: () => api.get('/whatsapp/active'),

  // Admin Management
  getAllContacts: () => api.get('/whatsapp/admin/contacts'),
  createContact: (data) => api.post('/whatsapp/admin/contacts', data),
  updateContact: (id, data) => api.put(`/whatsapp/admin/contacts/${id}`, data),
  setPrimaryContact: (id) => api.put(`/whatsapp/admin/contacts/${id}/primary`),
  toggleContactStatus: (id) => api.put(`/whatsapp/admin/contacts/${id}/status`),
  deleteContact: (id) => api.delete(`/whatsapp/admin/contacts/${id}`),
}
