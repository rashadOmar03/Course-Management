import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5063/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

const safeGetToken = () => {
  try {
    return sessionStorage.getItem('token');
  } catch {
    return null;
  }
};

const safeClearAuth = () => {
  try {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event('auth-change'));
};

api.interceptors.request.use((config) => {
  const token = safeGetToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      safeClearAuth();
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
