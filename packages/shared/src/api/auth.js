// api/auth.js
import { apiCall } from './httpClient.js';
import { setAuthToken, setAuthUser, clearAuth, getSafeMessage } from './config.js';

/**
 * Login user
 */
export async function login(credentials) {
  try {
    const { res, data } = await apiCall('/api/v1/auth/login', {
      method: 'POST',
      body: credentials,
    });

    if (res.ok && data?.success) {
      const token = data.data?.token;
      const user = data.data?.user;

      if (token && user) {
        setAuthToken(token);
        setAuthUser(user);
        return { success: true, user, token };
      }
    }

    return {
      success: false,
      message: getSafeMessage(data, 'Login failed')
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: error.message || 'Login failed'
    };
  }
}

/**
 * Register user
 */
export async function register(userData) {
  try {
    const { res, data } = await apiCall('/api/v1/auth/register', {
      method: 'POST',
      body: userData,
    });

    if (res.ok && data?.success) {
      const token = data.data?.token;
      const user = data.data?.user;

      if (token && user) {
        setAuthToken(token);
        setAuthUser(user);
        return { success: true, user, token };
      }
    }

    return {
      success: false,
      message: getSafeMessage(data, 'Registration failed')
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: error.message || 'Registration failed'
    };
  }
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  try {
    const { res, data } = await apiCall('/api/v1/auth/me');
    if (res.ok && data?.success) {
      setAuthUser(data.data);
      return data.data;
    }
    return null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Logout user
 */
export function logout() {
  clearAuth();
  window.dispatchEvent(new Event('auth:logout'));
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!localStorage.getItem('auth_token');
}

export default {
  login,
  register,
  getCurrentUser,
  logout,
  isAuthenticated,
};
