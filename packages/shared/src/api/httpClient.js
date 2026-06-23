// api/httpClient.js
import {
  API_CONFIG,
  getAuthToken,
  buildUrl,
  getSafeMessage,
  clearAuth,
  NETWORK_ERROR_MSG
} from './config.js';

/**
 * Main HTTP client for API calls
 */
export async function httpClient(path, options = {}) {
  const {
    token: tokenOption,
    body,
    headers: customHeaders,
    params,
    method = 'GET',
    timeout = API_CONFIG.timeout,
    ...rest
  } = options;

  const url = buildUrl(path, params);
  const token = tokenOption || getAuthToken();

  const headers = {
    ...API_CONFIG.defaultHeaders,
    ...customHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let requestBody = body;
  if (body !== undefined) {
    if (body instanceof FormData) {
      delete headers['Content-Type'];
      requestBody = body;
    } else if (headers['Content-Type'] === 'application/json') {
      requestBody = JSON.stringify(body);
    }
  }

  const fetchOptions = {
    method,
    headers,
    ...rest,
  };

  if (method !== 'GET' && method !== 'HEAD' && requestBody !== undefined) {
    fetchOptions.body = requestBody;
  }

  // Add timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  fetchOptions.signal = controller.signal;

  try {
    const res = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);
    return res;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

/**
 * Parse response with better error handling
 */
export async function parseResponse(res) {
  let data = null;
  const contentType = res.headers.get('content-type');

  try {
    if (contentType && contentType.includes('application/json')) {
      const text = await res.text();
      if (text && text.trim()) {
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error('JSON parsing error:', parseError);
        }
      }
    } else {
      const preview = await res.text();
      console.warn('Non-JSON response:', preview);
      if (res.ok) {
        data = {
          success: true,
          data: null,
          message: 'Success',
          raw: preview
        };
      } else {
        data = {
          success: false,
          message: `Server error: ${res.status} ${res.statusText}`,
          data: null,
          raw: preview
        };
      }
    }
  } catch (error) {
    console.error('Response handling error:', error);
    data = {
      success: false,
      message: 'Failed to process server response',
      data: null
    };
  }

  // Handle unauthorized responses
  if (res.status === 401) {
    clearAuth();
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new Error('Session expired. Please login again.');
  }

  return { res, data };
}

/**
 * API call wrapper with automatic error handling
 */
export async function apiCall(path, options = {}) {
  try {
    const res = await httpClient(path, options);
    const result = await parseResponse(res);
    const { data } = result;

    if (!res.ok) {
      const errorMessage = getSafeMessage(data, `HTTP ${res.status}: ${res.statusText}`);
      throw new Error(errorMessage);
    }

    if (data && data.success === false) {
      throw new Error(getSafeMessage(data, 'Operation failed'));
    }

    return result;
  } catch (error) {
    if (error.message === NETWORK_ERROR_MSG) {
      throw error;
    }
    throw new Error(error.message || NETWORK_ERROR_MSG);
  }
}

// Backward compatibility alias
export const apiFetch = async (path, options = {}) => {
  const { res, data } = await apiCall(path, options);
  return { res, data };
};

export default {
  httpClient,
  parseResponse,
  apiCall,
  apiFetch
};
