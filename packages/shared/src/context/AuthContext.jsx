// context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api/httpClient.js';
import { clearAuth } from '../api/config.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
        setRole(userData.role);
        setOrganization(userData.organization || null);
        validateSession(storedToken);
      } catch (err) {
        handleLogout();
      }
    } else {
      setLoading(false);
    }
  }, []);

  const validateSession = async (authToken) => {
    try {
      const { res, data } = await apiFetch('/api/v1/auth/me', { token: authToken });
      if (res.ok && data.success) {
        const userData = data.data;
        setUser(userData);
        setRole(userData.role);
        setOrganization(userData.organization || null);
        localStorage.setItem('auth_user', JSON.stringify(userData));
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error('Session validation failed:', err);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    setError(null);
    try {
      const { res, data } = await apiFetch('/api/v1/auth/login', {
        method: 'POST',
        body: credentials,
      });

      if (res.ok && data.success) {
        const authToken = data.data.token;
        const userData = data.data.user;

        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('auth_user', JSON.stringify(userData));

        setToken(authToken);
        setUser(userData);
        setRole(userData.role);
        setOrganization(userData.organization || null);

        return { success: true, user: userData };
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const { res, data } = await apiFetch('/api/v1/auth/register', {
        method: 'POST',
        body: userData,
      });

      if (res.ok && data.success) {
        const authToken = data.data.token;
        const newUser = data.data.user;

        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('auth_user', JSON.stringify(newUser));

        setToken(authToken);
        setUser(newUser);
        setRole(newUser.role);
        setOrganization(newUser.organization || null);

        return { success: true, user: newUser };
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
    setRole(null);
    setOrganization(null);
    setLoading(false);
  }, []);

  const hasRole = useCallback((requiredRole) => {
    if (!role) return false;
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(role);
    }
    return role === requiredRole;
  }, [role]);

  const isSuperAdmin = useCallback(() => hasRole('SUPER_ADMIN'), [hasRole]);
  const isAdmin = useCallback(() => hasRole('ADMIN'), [hasRole]);
  const isUser = useCallback(() => hasRole('USER'), [hasRole]);

  const value = {
    token,
    user,
    role,
    organization,
    loading,
    error,
    login,
    register,
    logout: handleLogout,
    hasRole,
    isSuperAdmin,
    isAdmin,
    isUser,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
