import api from './api.js';

export const login = (username, password) =>
  api.post('/Auth/login', { username, password }).then((r) => r.data);

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
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
