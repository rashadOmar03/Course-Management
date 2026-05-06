import api from './api.js';

export const getStudents = () => api.get('/Student').then((r) => r.data);

export const getStudent = (id) =>
  api.get(`/Student/${id}`).then((r) => r.data);

export const updateStudent = (id, payload) =>
  api.put(`/Student/${id}`, payload).then((r) => r.data);

export const deleteStudent = (id) =>
  api.delete(`/Student/${id}`).then((r) => r.data);
