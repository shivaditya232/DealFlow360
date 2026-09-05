import axios from 'axios';
import { getToken, clearAuth } from '../utils/authStorage';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Centralized Axios API Client
 * 
 * - Prepend base URL (defaulting to /api)
 * - Automatically injects Bearer <token> from authStorage
 * - Global 401 response handling (clears session & redirects to /login)
 * - Passes through 400, 404, 409, 429 without modification
 */
export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Authorization Header
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: 401 Token Expiry / Unauthorized Handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear all stored credentials
      clearAuth();

      // If not already on /login or /signup, redirect to /login
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path !== '/login' && path !== '/signup') {
          window.location.href = '/login';
        }
      }
    }

    // Do NOT alter 400, 404, 409, 429 or other responses
    return Promise.reject(error);
  }
);

export default api;
