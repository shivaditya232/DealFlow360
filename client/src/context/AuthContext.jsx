import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/auth.service';
import authStorage from '../utils/authStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => authStorage.getToken());
  const [user, setUser] = useState(() => authStorage.getUser());
  const [customer, setCustomer] = useState(() => authStorage.getCustomer());
  const [accountType, setAccountType] = useState(() => authStorage.getAccountType());
  const [landing, setLanding] = useState(() => authStorage.getLanding());
  const [isLoading, setIsLoading] = useState(true);

  // Synchronize state with storage on mount
  useEffect(() => {
    const storedToken = authStorage.getToken();
    const storedUser = authStorage.getUser();
    const storedCustomer = authStorage.getCustomer();
    const storedAccountType = authStorage.getAccountType();
    const storedLanding = authStorage.getLanding();

    setToken(storedToken);
    setUser(storedUser);
    setCustomer(storedCustomer);
    setAccountType(storedAccountType);
    setLanding(storedLanding);
    setIsLoading(false);
  }, []);

  /**
   * Login handler
   */
  const login = useCallback(async ({ companySlug, email, password, rememberMe = false }) => {
    const data = await authService.login({ companySlug, email, password });

    const determinedAccountType = data.user ? 'INTERNAL' : data.customer ? 'CUSTOMER' : null;

    authStorage.setAuth({
      token: data.token,
      user: data.user || null,
      customer: data.customer || null,
      landing: data.landing,
      accountType: determinedAccountType,
      rememberMe,
    });

    setToken(data.token);
    setUser(data.user || null);
    setCustomer(data.customer || null);
    setAccountType(determinedAccountType);
    setLanding(data.landing);

    return data;
  }, []);

  /**
   * Signup handler
   */
  const signup = useCallback(async (payload) => {
    const data = await authService.signup(payload);

    const determinedAccountType = data.user ? 'INTERNAL' : data.customer ? 'CUSTOMER' : payload.accountType;

    authStorage.setAuth({
      token: data.token,
      user: data.user || null,
      customer: data.customer || null,
      landing: data.landing,
      accountType: determinedAccountType,
      rememberMe: true,
    });

    setToken(data.token);
    setUser(data.user || null);
    setCustomer(data.customer || null);
    setAccountType(determinedAccountType);
    setLanding(data.landing);

    return data;
  }, []);

  /**
   * Logout handler
   */
  const logout = useCallback(() => {
    authStorage.clearAuth();
    setToken(null);
    setUser(null);
    setCustomer(null);
    setAccountType(null);
    setLanding(null);
  }, []);

  const value = {
    user,
    customer,
    token,
    accountType,
    role: user?.role || null,
    landing,
    isAuthenticated: Boolean(token),
    isLoading,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
