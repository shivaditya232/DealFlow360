import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Login stores the token in localStorage (remember me) OR sessionStorage —
// check both so a refreshed tab doesn't look logged-out either way.
export function getToken() {
  return localStorage.getItem('df_token') || sessionStorage.getItem('df_token');
}

export function getStoredUser() {
  const raw = localStorage.getItem('df_user') || sessionStorage.getItem('df_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem('df_token');
  localStorage.removeItem('df_user');
  sessionStorage.removeItem('df_token');
  sessionStorage.removeItem('df_user');
}

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // No response at all (dropped connection, DNS failure, CORS-from-being-
    // offline, timeout) is categorically different from the server coming
    // back with a 4xx/5xx — flag it so callers can show "you're offline"
    // instead of misreading it as "invalid input" or "access denied".
    err.isOffline = !err.response;
    err.friendlyMessage = err.isOffline
      ? "You're offline — check your connection and try again."
      : err.response?.data?.error || err.response?.data?.message;

    if (err.response?.status === 401) {
      clearSession();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
