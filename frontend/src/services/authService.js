import api from './api.js';

// One-time cleanup: if older builds saved auth in localStorage, drop it.
// Tokens now live only in sessionStorage so they don't persist across browser
// sessions and aren't reachable from other tabs/windows.
try {
  if (typeof localStorage !== 'undefined') {
    if (localStorage.getItem('token') || localStorage.getItem('user')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
} catch {
  // ignore (storage disabled)
}

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

const persistAuth = (data) => {
  if (!data?.token) return;
  sessionStorage.setItem(TOKEN_KEY, data.token);
  sessionStorage.setItem(
    USER_KEY,
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

export const getToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const clearAuth = () => {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
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

export const logout = () => clearAuth();

export const getCurrentUser = () => {
  let raw = null;
  try {
    raw = sessionStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const isAuthenticated = () => Boolean(getToken());

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
