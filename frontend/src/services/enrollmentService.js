import api from './api.js';

// Admin
export const getEnrollments = () =>
  api.get('/Enrollment').then((r) => r.data);

export const getEnrollmentsByCourse = (courseId) =>
  api.get(`/Enrollment/by-course/${courseId}`).then((r) => r.data);

export const getEnrollmentsByStudent = (studentId) =>
  api.get(`/Enrollment/by-student/${studentId}`).then((r) => r.data);

export const enroll = (studentId, courseId) =>
  api.post('/Enrollment', { studentId, courseId }).then((r) => r.data);

export const unenroll = (studentId, courseId) =>
  api.delete(`/Enrollment/${studentId}/${courseId}`).then((r) => r.data);

// Student
export const getMyEnrollments = () =>
  api.get('/Enrollment/me').then((r) => r.data);

export const selfEnroll = (courseId) =>
  api.post(`/Enrollment/me/${courseId}`).then((r) => r.data);

export const selfUnenroll = (courseId) =>
  api.delete(`/Enrollment/me/${courseId}`).then((r) => r.data);

// Instructor
export const getTeachingEnrollments = () =>
  api.get('/Enrollment/teaching').then((r) => r.data);
