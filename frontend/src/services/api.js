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
    const { params, ...rest } = options;
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
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...rest.headers,
      },
      ...rest,
    };

    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (import.meta.env.DEV) {
      // In development mode, use a test token if no auth token is present
      config.headers.Authorization = `Bearer test-token`;
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

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // GET request
  async get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
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
