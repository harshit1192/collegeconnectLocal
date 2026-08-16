import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

// Central place for auth state: current user, token persistence, and the
// login/register/logout actions. Wrap the app in <AuthProvider> once in
// main.jsx / App.jsx and use `useAuth()` anywhere you need auth state.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while checking existing session

  // On first load, if a token is already saved, fetch the current user so
  // refreshing the page doesn't log the user out.
  useEffect(() => {
    const token = localStorage.getItem('cc_token');
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem('cc_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    return res.data; // { success, message } — user must verify email before logging in
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('cc_token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Even if the API call fails, still clear local state.
    }
    localStorage.removeItem('cc_token');
    setUser(null);
  };

  const forgotPassword = async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  };

  const resetPassword = async (token, password, confirmPassword) => {
    const res = await api.post(`/auth/reset-password/${token}`, {
      password,
      confirmPassword,
    });
    return res.data;
  };

  const verifyEmail = async (token) => {
    const res = await api.get(`/auth/verify-email/${token}`);
    return res.data;
  };

  // Re-fetch the current user from the API (e.g. after editing a profile
  // field elsewhere) so the rest of the app sees fresh data.
  const refreshUser = async () => {
    const res = await api.get('/auth/me');
    setUser(res.data.user);
    return res.data.user;
  };

  const value = {
    user,
    setUser,
    loading,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    forgotPassword,
    resetPassword,
    verifyEmail,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>');
  return ctx;
}
