import api from './api.js';

// Admin
export const getEnrollments = () =>
  api.get('/Enrollment').then((r) => r.data);

export const getPendingEnrollments = () =>
  api.get('/Enrollment/pending').then((r) => r.data);

export const getEnrollmentsByCourse = (courseId) =>
  api.get(`/Enrollment/by-course/${courseId}`).then((r) => r.data);

export const getEnrollmentsByStudent = (studentId) =>
  api.get(`/Enrollment/by-student/${studentId}`).then((r) => r.data);

export const enroll = (studentId, courseId) =>
  api.post('/Enrollment', { studentId, courseId }).then((r) => r.data);

export const approveEnrollment = (studentId, courseId) =>
  api
    .post(`/Enrollment/${studentId}/${courseId}/approve`)
    .then((r) => r.data);

export const unenroll = (studentId, courseId) =>
  api.delete(`/Enrollment/${studentId}/${courseId}`).then((r) => r.data);

// Student
export const getMyEnrollments = () =>
  api.get('/Enrollment/me').then((r) => r.data);

export const requestEnrollment = (courseId) =>
  api.post(`/Enrollment/me/${courseId}`).then((r) => r.data);

// Kept as an alias of requestEnrollment for backwards compatibility
export const selfEnroll = requestEnrollment;

export const selfUnenroll = (courseId) =>
  api.delete(`/Enrollment/me/${courseId}`).then((r) => r.data);

// Instructor
export const getTeachingEnrollments = () =>
  api.get('/Enrollment/teaching').then((r) => r.data);

export const setGrade = (studentId, courseId, grade) =>
  api
    .put(`/Enrollment/${studentId}/${courseId}/grade`, { grade })
    .then((r) => r.data);

export const instructorAddStudent = (courseId, studentId) =>
  api
    .post(`/Enrollment/teaching/${courseId}/${studentId}`)
    .then((r) => r.data);

export const instructorRemoveStudent = (studentId, courseId) =>
  api
    .delete(`/Enrollment/teaching/${studentId}/${courseId}`)
    .then((r) => r.data);
