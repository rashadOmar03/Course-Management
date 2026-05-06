import api from './api.js';

const persistAuth = (data) => {
  if (!data?.token) return;
  localStorage.setItem('token', data.token);
  localStorage.setItem(
    'user',
    JSON.stringify({
      userId: data.userId,
      username: data.username,
      role: data.role,
      studentId: data.studentId ?? null,
      instructorId: data.instructorId ?? null,
      isApprovedInstructor: data.isApprovedInstructor ?? false,
    })
  );
  window.dispatchEvent(new Event('auth-change'));
};

export const login = async (username, password) => {
  const { data } = await api.post('/Auth/login', { username, password });
  persistAuth(data);
  return data;
};

export const signupStudent = async (payload) => {
  const { data } = await api.post('/Auth/signup/student', payload);
  persistAuth(data);
  return data;
};

export const signupInstructor = async (payload) => {
  const { data } = await api.post('/Auth/signup/instructor', payload);
  persistAuth(data);
  return data;
};

export const fetchMe = () => api.get('/Auth/me').then((r) => r.data);

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('auth-change'));
};

export const getCurrentUser = () => {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const isAuthenticated = () => Boolean(localStorage.getItem('token'));

export const hasRole = (...roles) => {
  const user = getCurrentUser();
  return !!user && roles.includes(user.role);
};

export const homePathForRole = (role) => {
  if (role === 'Admin') return '/admin';
  if (role === 'Instructor') return '/instructor';
  if (role === 'Student') return '/student';
  return '/login';
};
