import { getAbortSignal, handleUnauthorized } from '@/features/auth';

// API Base Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function toFriendlyMessage(message = '', { endpoint, status, data } = {}) {
  const lower = String(message || '').toLowerCase();
  if (data?.code === '23505' || lower.includes('duplicate key value')) {
    if (lower.includes('services_service_code_key') || lower.includes('service_code')) {
      return 'Service code already exists. Please use a different code.';
    }
    return 'A record with the same value already exists.';
  }
  if (lower.includes('missing required fields')) {
    return message.replace(/failed to create service:\s*/i, '').trim();
  }
  if (lower.includes('violates foreign key constraint')) {
    return 'Operation blocked because this record is referenced by other data.';
  }
  if (status === 404 || lower.includes('not found')) {
    return 'Resource not found.';
  }
  if (lower.includes('validation')) {
    return 'Some inputs are invalid. Please check and try again.';
  }
  return message || 'Something went wrong';
}

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
    // eslint-disable-next-line no-unused-vars
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
      
      // If there's no token, user is already logged out - silently ignore this error
      // This prevents error logs when components make requests after logout
      if (!hasAuthToken && !isLoginEndpoint) {
        // User is already logged out, component is probably unmounting
        // Silently ignore this error to avoid noise in logs
        throw new Error('Unauthorized - user logged out');
      }
      
      if (!isLoginEndpoint || hasAuthToken) {
        // Global 401 handler: sign out and redirect (for authenticated requests)
        await handleUnauthorized();
        throw new Error('Unauthorized');
      } else {
        // Login failed - extract error message from response (friendly)
        const raw = data.message || data.error || 'Invalid credentials. Please check your email and password.';
        const errorMessage = toFriendlyMessage(raw, { endpoint, status: response.status, data });
        // Also surface via global error in case login pages want to show modal
        window.dispatchEvent(
          new CustomEvent('global-error', {
            detail: { message: errorMessage, code: data.code },
          })
        );
        throw new Error(errorMessage);
      }
    }

    if (!response.ok) {
      const raw = data.message || `HTTP error! status: ${response.status}`;
      let message = toFriendlyMessage(raw, { endpoint, status: response.status, data });
      
      // Handle specific error codes with user-friendly messages
      if (data.code === 'ORPHAN_TOKEN') {
        message = `Cannot complete consultation: Token is missing visit information. ` +
          `This is a data integrity issue. Please contact support. Token #${data.tokenNumber || 'unknown'}`;
      } else if (data.code === 'INVOICE_MISSING_VISIT') {
        message = `Cannot complete invoice: Invoice is missing visit information. ` +
          `This is a data integrity issue. Please contact support. Invoice #${data.invoiceNumber || 'unknown'}`;
      } else if (data.code === 'VISIT_UPDATE_FAILED') {
        message = `Consultation completed but failed to update visit. ` +
          `The consultation may need to be reviewed. Please refresh and check the status.`;
      }
      
      // Dispatch global error for non-401 failures
      if (response.status !== 401) {
        window.dispatchEvent(
          new CustomEvent('global-error', {
            detail: {
              message,
              code: data.code,
              details: data.errors || data.message || undefined,
            },
          })
        );
      }
      throw new Error(message);
    }

    return data;
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
      } catch {
        // Ignore - use statusText as fallback
      }
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
