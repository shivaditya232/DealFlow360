import api from './api';
import { clearAuth } from '../utils/authStorage';

/**
 * Authentication Service
 * 
 * Directly maps to backend endpoints:
 * - POST /api/auth/login
 * - POST /api/auth/signup
 */
export const authService = {
  /**
   * Authenticate user or customer
   * @param {{ companySlug: string, email: string, password: string }} credentials
   * @returns {Promise<{ token: string, landing: string, user?: object, customer?: object }>}
   */
  login: async ({ companySlug, email, password }) => {
    const response = await api.post('/auth/login', {
      companySlug,
      email,
      password,
    });
    return response.data;
  },

  /**
   * Register a new internal user or customer account
   * @param {{
   *   companySlug: string,
   *   accountType: 'INTERNAL' | 'CUSTOMER',
   *   email: string,
   *   password: string,
   *   name: string,
   *   role?: 'SALES_REP' | 'MANAGER' | 'FINANCE' | 'ADMIN'
   * }} payload
   * @returns {Promise<{ token: string, landing: string, user?: object, customer?: object }>}
   */
  signup: async (payload) => {
    const response = await api.post('/auth/signup', payload);
    return response.data;
  },

  /**
   * Centralized client logout
   */
  logout: () => {
    clearAuth();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
};

export default authService;
