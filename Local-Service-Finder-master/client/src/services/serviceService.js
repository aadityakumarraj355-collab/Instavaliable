import api from './api'

export const serviceService = {
  getAll: (params) => api.get('/services', { params }),
  getMyServices: () => api.get('/services/my-services'),
  getOne: (id) => api.get(`/services/${id}`),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`),
}
