import api from './api'

export const workerService = {
  getProfile: () => api.get('/workers/profile'),
  updateProfile: (data) => api.put('/workers/profile', data),
  getWorkerById: (id) => api.get(`/workers/${id}`),
}
