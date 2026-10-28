/**
 * GymCore API Client Service
 * Centralized API client configured with environment variables
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const apiClient = {
  baseUrl: API_BASE_URL,

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const token = localStorage.getItem('gymcore_token');

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || `HTTP error ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error on ${url}:`, error);
      throw error;
    }
  },

  get(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'GET', headers });
  },

  post(endpoint, body, headers = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      headers,
    });
  },

  put(endpoint, body, headers = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers,
    });
  },

  delete(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'DELETE', headers });
  },

  async checkStatus() {
    return this.get('/status');
  },
};

export default apiClient;
