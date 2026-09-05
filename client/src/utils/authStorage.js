/**
 * Centralized Authentication Storage Utility
 * 
 * Manages JWT tokens, user profiles, and session metadata.
 * Supports rememberMe (localStorage) vs session-only (sessionStorage).
 */

const TOKEN_KEY = 'df_token';
const USER_KEY = 'df_user';
const CUSTOMER_KEY = 'df_customer';
const ACCOUNT_TYPE_KEY = 'df_account_type';
const LANDING_KEY = 'df_landing';

/**
 * Get active token from either localStorage or sessionStorage
 * @returns {string | null}
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
}

/**
 * Get stored internal user
 * @returns {object | null}
 */
export function getUser() {
  const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Get stored external customer
 * @returns {object | null}
 */
export function getCustomer() {
  const raw = localStorage.getItem(CUSTOMER_KEY) || sessionStorage.getItem(CUSTOMER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Get stored account type: 'INTERNAL' | 'CUSTOMER' | null
 * @returns {string | null}
 */
export function getAccountType() {
  return localStorage.getItem(ACCOUNT_TYPE_KEY) || sessionStorage.getItem(ACCOUNT_TYPE_KEY) || null;
}

/**
 * Get user role if internal: 'SALES_REP' | 'MANAGER' | 'FINANCE' | 'ADMIN' | null
 * @returns {string | null}
 */
export function getRole() {
  const user = getUser();
  return user?.role || null;
}

/**
 * Get last landing target: 'DASHBOARD' | 'PORTAL' | null
 * @returns {string | null}
 */
export function getLanding() {
  return localStorage.getItem(LANDING_KEY) || sessionStorage.getItem(LANDING_KEY) || null;
}

/**
 * Store authentication session
 * @param {{
 *   token: string,
 *   user?: object,
 *   customer?: object,
 *   landing?: string,
 *   accountType?: string,
 *   rememberMe?: boolean
 * }} params
 */
export function setAuth({ token, user, customer, landing, accountType, rememberMe = false }) {
  // Clear any existing values in both stores first
  clearAuth();

  const storage = rememberMe ? localStorage : sessionStorage;

  if (token) {
    storage.setItem(TOKEN_KEY, token);
  }

  if (user) {
    storage.setItem(USER_KEY, JSON.stringify(user));
    storage.setItem(ACCOUNT_TYPE_KEY, 'INTERNAL');
  } else if (customer) {
    storage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
    storage.setItem(ACCOUNT_TYPE_KEY, 'CUSTOMER');
  } else if (accountType) {
    storage.setItem(ACCOUNT_TYPE_KEY, accountType);
  }

  if (landing) {
    storage.setItem(LANDING_KEY, landing);
  }
}

/**
 * Clear all authentication tokens and state from all browser storage
 */
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(CUSTOMER_KEY);
  localStorage.removeItem(ACCOUNT_TYPE_KEY);
  localStorage.removeItem(LANDING_KEY);

  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(CUSTOMER_KEY);
  sessionStorage.removeItem(ACCOUNT_TYPE_KEY);
  sessionStorage.removeItem(LANDING_KEY);
}

export default {
  getToken,
  getUser,
  getCustomer,
  getAccountType,
  getRole,
  getLanding,
  setAuth,
  clearAuth,
};
