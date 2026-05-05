import api from './api.js';

export const getCourses = () => api.get('/Course').then((r) => r.data);

export const getCourse = (id) => api.get(`/Course/${id}`).then((r) => r.data);

export const createCourse = (payload) =>
  api.post('/Course', payload).then((r) => r.data);

export const updateCourse = (id, payload) =>
  api.put(`/Course/${id}`, payload).then((r) => r.data);

export const deleteCourse = (id) =>
  api.delete(`/Course/${id}`).then((r) => r.data);

export const getInstructors = () =>
  api.get('/Instructor').then((r) => r.data);
