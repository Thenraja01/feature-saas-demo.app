// api/config.js
export const NETWORK_ERROR_MSG = 'Cannot reach the server. Please check your connection and ensure the server is running.';

// Safe environment variable access
const getEnvVar = (name) => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[name];
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name];
  }
  return undefined;
};

// Base API configuration
export const API_CONFIG = {
  baseURL: getEnvVar('VITE_API_URL') || 'http://localhost:5000',
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
};

export const getAuthToken = () => {
  return localStorage.getItem('auth_token') || null;
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

export const getAuthUser = () => {
  try {
    const user = localStorage.getItem('auth_user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const setAuthUser = (user) => {
  if (user) {
    localStorage.setItem('auth_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('auth_user');
  }
};

export const clearAuth = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
};

export const buildUrl = (path, params = {}) => {
  const baseUrl = `${API_CONFIG.baseURL}${path}`;
  if (!params || Object.keys(params).length === 0) return baseUrl;

  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value);
    }
  });

  const queryString = queryParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

export const getSafeMessage = (data, fallback = 'An error occurred') => {
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (data.message) return data.message;
  if (data.error) {
    if (typeof data.error === 'string') return data.error;
    if (data.error.message) return data.error.message;
  }
  return fallback;
};
