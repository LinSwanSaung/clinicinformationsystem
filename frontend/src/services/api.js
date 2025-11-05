import { getAbortSignal, handleUnauthorized } from './sessionGuard';

// API Base Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Health check against server root /health
  async health() {
    // Derive API origin (strip trailing /api if present)
    let base = this.baseURL;
    if (base.endsWith('/api')) {
      base = base.slice(0, -4);
    }
    const res = await fetch(`${base}/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
    return res.json();
  }

  async request(endpoint, options = {}) {
    // Support optional params object to be serialized into query string
    const { params, headers: customHeaders, ...rest } = options;
    let url = `${this.baseURL}${endpoint}`;
    if (params && typeof params === 'object') {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          qs.append(key, String(value));
        }
      });
      const qsStr = qs.toString();
      if (qsStr) {
        url += (url.includes('?') ? '&' : '?') + qsStr;
      }
    }

    const method = (rest.method ? rest.method.toUpperCase() : 'GET');
    const { method: _ignored, ...restWithoutMethod } = rest;
    const fetchOptions = { ...restWithoutMethod, method };

    if (method === 'GET') {
      const cacheBuster = `_=${Date.now()}`;
      url += (url.includes('?') ? '&' : '?') + cacheBuster;
    }
    
    // Build headers - don't set Content-Type for FormData (browser will set it with boundary)
    const headers = {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      ...customHeaders,
    };
    
    // Only set Content-Type to application/json if body is not FormData
    if (fetchOptions.body && !(fetchOptions.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    
    const config = {
      cache: 'no-store',
      headers,
      signal: getAbortSignal(),
      ...fetchOptions,
    };

    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (import.meta.env.DEV && import.meta.env.VITE_USE_DEV_TOKEN === 'true') {
      // Optional dev bypass, explicit opt-in
      config.headers.Authorization = `Bearer test-token`;
      if (import.meta.env.VITE_DEV_ROLE) {
        config.headers['X-Dev-Role'] = String(import.meta.env.VITE_DEV_ROLE);
      }
    }

    try {
      const response = await fetch(url, config);
      
      // Handle 204 No Content gracefully
      if (response.status === 204) {
        return { success: true };
      }

      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = { message: response.statusText };
      }

      if (response.status === 401) {
        // Don't redirect on login failures - let the login component show the error
        // Only redirect if user is already authenticated (has token) or on non-login endpoints
        const isLoginEndpoint = endpoint.includes('/auth/login');
        const hasAuthToken = !!localStorage.getItem('authToken');
        
        if (!isLoginEndpoint || hasAuthToken) {
          // Global 401 handler: sign out and redirect (for authenticated requests)
          await handleUnauthorized();
          throw new Error('Unauthorized');
        } else {
          // Login failed - extract error message from response
          const errorMessage = data.message || data.error || 'Invalid credentials. Please check your email and password.';
          throw new Error(errorMessage);
        }
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // GET request returning Blob (e.g., PDFs). Inherits 401 handling and abort.
  async getBlob(endpoint, options = {}) {
    // Support optional params object to be serialized into query string
    const { params, headers: customHeaders, ...rest } = options;
    let url = `${this.baseURL}${endpoint}`;
    if (params && typeof params === 'object') {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          qs.append(key, String(value));
        }
      });
      const qsStr = qs.toString();
      if (qsStr) {
        url += (url.includes('?') ? '&' : '?') + qsStr;
      }
    }

    // Cache-bust GETs to avoid stale browser cache
    const cacheBuster = `_=${Date.now()}`;
    url += (url.includes('?') ? '&' : '?') + cacheBuster;

    const headers = {
      'Cache-Control': 'no-store',
      Pragma: 'no-cache',
      Accept: customHeaders?.Accept || 'application/pdf',
      ...customHeaders,
    };

    const config = {
      method: 'GET',
      cache: 'no-store',
      headers,
      signal: getAbortSignal(),
      ...rest,
    };

    // Add auth token if available (or dev token if configured)
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (import.meta.env.DEV && import.meta.env.VITE_USE_DEV_TOKEN === 'true') {
      config.headers.Authorization = `Bearer test-token`;
      if (import.meta.env.VITE_DEV_ROLE) {
        config.headers['X-Dev-Role'] = String(import.meta.env.VITE_DEV_ROLE);
      }
    }

    const response = await fetch(url, config);

    if (response.status === 401) {
      await handleUnauthorized();
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      // Try to extract text error for easier debugging
      let message = response.statusText;
      try {
        message = await response.text();
      } catch {}
      throw new Error(message || `HTTP error! status: ${response.status}`);
    }

    return await response.blob();
  }

  // GET request
  async get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // PATCH request
  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  }
}

export default new ApiService();
