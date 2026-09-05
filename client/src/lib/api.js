import axios from 'axios';
// Bug fix: this file used to reimplement its own token storage
// (localStorage.getItem('df_token') || sessionStorage.getItem('df_token'))
// completely independently of src/utils/authStorage.js — a second copy of
// the exact same "fall back to localStorage" bug that broke having
// different roles logged in in different tabs at once (localStorage is
// shared across every tab of the same origin, so one tab's session kept
// bleeding into / stomping on every other tab's). Since this file backs
// most of the app's API calls (product/config/quotation/portal/approval/
// customer/dashboard/otp services all import from here — only
// auth.service.js used its own separate axios instance), fixing
// authStorage.js alone wasn't enough; this had to delegate to the same
// single, now-tab-scoped source of truth instead of keeping its own copy.
import { getToken as getStoredToken, clearAuth } from '../utils/authStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Re-exported for anything importing getToken from here (e.g. lib/socket.js)
// — now just forwards to authStorage so there is exactly one implementation.
export function getToken() {
  return getStoredToken();
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
      clearAuth();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
