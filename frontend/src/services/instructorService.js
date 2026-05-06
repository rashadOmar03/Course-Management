import api from './api.js';

// Approved-only catalog (anyone authenticated)
export const getInstructors = () =>
  api.get('/Instructor').then((r) => r.data);

// Admin-only: list everything (including pending)
export const getAllInstructors = () =>
  api.get('/Instructor/all').then((r) => r.data);

export const getPendingInstructors = () =>
  api.get('/Instructor/pending').then((r) => r.data);

export const getInstructor = (id) =>
  api.get(`/Instructor/${id}`).then((r) => r.data);

export const createInstructor = (payload) =>
  api.post('/Instructor', payload).then((r) => r.data);

export const updateInstructor = (id, payload) =>
  api.put(`/Instructor/${id}`, payload).then((r) => r.data);

export const approveInstructor = (id) =>
  api.post(`/Instructor/${id}/approve`).then((r) => r.data);

export const deleteInstructor = (id) =>
  api.delete(`/Instructor/${id}`).then((r) => r.data);
