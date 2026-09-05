import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const authService = {
  /**
   * Authenticate with companySlug, email, password
   * @param {{ companySlug: string, email: string, password: string }} credentials
   */
  login: async ({ companySlug, email, password }) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      companySlug,
      email,
      password,
    });
    return response.data;
  },

  /**
   * Register a new user/customer account
   * @param {{ companySlug: string, email: string, password: string, name: string, accountType: string, role?: string }} data
   */
  signup: async (data) => {
    const response = await axios.post(`${API_BASE_URL}/auth/signup`, data);
    return response.data;
  },
};

export default authService;
