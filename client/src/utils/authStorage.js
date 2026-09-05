/**
 * Centralized Authentication Storage Utility
 *
 * Bug fix: this used to write to localStorage when rememberMe was true (and
 * signup() in AuthContext.jsx always passed rememberMe: true), then have
 * every read fall back from localStorage to sessionStorage. localStorage is
 * shared by EVERY tab of the same origin — it has no per-tab concept at
 * all — so as soon as one tab signed up or logged in with "Remember me",
 * every other tab's read would silently pick up that same session the next
 * time it checked (via the `localStorage.getItem(...) ||
 * sessionStorage.getItem(...)` fallback), and setAuth()'s unconditional
 * clearAuth() call would wipe that shared localStorage entry out from under
 * every other tab the moment ANY tab logged into a different account. That
 * is exactly why testing different roles in different tabs kept failing:
 * it wasn't really "different tabs, different roles" — every tab was
 * fighting over the same one global slot.
 *
 * Fix: sessionStorage only, no exceptions. sessionStorage is guaranteed by
 * the browser to be independent per tab (a tab opened by typing/pasting a
 * URL, not by "duplicate tab", always starts with a fresh, empty
 * sessionStorage) — so each tab now reliably keeps its own session for as
 * long as that tab stays open, and logging into a different role in
 * another tab can no longer touch it. The trade-off: a session no longer
 * survives closing the tab / restarting the browser (what "Remember me"
 * used to buy you) — `rememberMe` is still accepted here so callers don't
 * need changes, it's just a no-op now. If persistence-across-restart is
 * wanted back later, that needs a per-tab-keyed storage scheme, not a
 * blanket localStorage flag — flag this file if that comes up.
 */

const TOKEN_KEY = 'df_token';
const USER_KEY = 'df_user';
const CUSTOMER_KEY = 'df_customer';
const ACCOUNT_TYPE_KEY = 'df_account_type';
const LANDING_KEY = 'df_landing';

const ALL_KEYS = [TOKEN_KEY, USER_KEY, CUSTOMER_KEY, ACCOUNT_TYPE_KEY, LANDING_KEY];

// One-time cleanup: purge any stale localStorage entries left over from
// before this fix (e.g. from an earlier "Remember me" login or any
// signup, which always used to write here) — otherwise an already-open
// browser profile would keep silently bleeding that old session into
// fresh tabs even after this fix ships, since nothing else clears it.
try {
  ALL_KEYS.forEach((key) => localStorage.removeItem(key));
} catch {
  // localStorage can throw in some contexts (privacy mode, disabled
  // storage) — never let cleanup break the app.
}

/**
 * Get active token for THIS tab's session.
 * @returns {string | null}
 */
export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY) || null;
}

/**
 * Get stored internal user for THIS tab's session.
 * @returns {object | null}
 */
export function getUser() {
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Get stored external customer for THIS tab's session.
 * @returns {object | null}
 */
export function getCustomer() {
  const raw = sessionStorage.getItem(CUSTOMER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Get stored account type for THIS tab's session: 'INTERNAL' | 'CUSTOMER' | null
 * @returns {string | null}
 */
export function getAccountType() {
  return sessionStorage.getItem(ACCOUNT_TYPE_KEY) || null;
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
 * Get last landing target for THIS tab's session: 'DASHBOARD' | 'PORTAL' | null
 * @returns {string | null}
 */
export function getLanding() {
  return sessionStorage.getItem(LANDING_KEY) || null;
}

/**
 * Store authentication session — always scoped to THIS tab (see the
 * file-level comment for why `rememberMe` is accepted but ignored).
 * @param {{
 *   token: string,
 *   user?: object,
 *   customer?: object,
 *   landing?: string,
 *   accountType?: string,
 *   rememberMe?: boolean
 * }} params
 */
export function setAuth({ token, user, customer, landing, accountType }) {
  // Clear this tab's own previous session first (switching accounts within
  // the same tab), then write the new one — both scoped to sessionStorage
  // only, so nothing here can touch any other tab.
  clearAuth();

  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token);
  }

  if (user) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    sessionStorage.setItem(ACCOUNT_TYPE_KEY, 'INTERNAL');
  } else if (customer) {
    sessionStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
    sessionStorage.setItem(ACCOUNT_TYPE_KEY, 'CUSTOMER');
  } else if (accountType) {
    sessionStorage.setItem(ACCOUNT_TYPE_KEY, accountType);
  }

  if (landing) {
    sessionStorage.setItem(LANDING_KEY, landing);
  }
}

/**
 * Clear this tab's authentication state.
 */
export function clearAuth() {
  ALL_KEYS.forEach((key) => sessionStorage.removeItem(key));
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
