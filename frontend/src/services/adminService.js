import api from './api.js';

export const getAdmins = () => api.get('/Auth/admins').then((r) => r.data);

export const createAdmin = (payload) =>
  api.post('/Auth/admins', payload).then((r) => r.data);

export const deleteAdmin = (id) =>
  api.delete(`/Auth/admins/${id}`).then((r) => r.data);
