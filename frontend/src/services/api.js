/**
 * GymCore API Client Service
 * Centralized API client configured with environment variables
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const TOKEN_KEY = 'gymcore_token';

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.errors = data?.errors || {};
  }
}

export const apiClient = {
  baseUrl: API_BASE_URL,

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const token = this.getToken();

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
        // If unauthenticated or token revoked, dispatch unauthorized event
        if (response.status === 401) {
          window.dispatchEvent(new CustomEvent('gymcore:unauthorized'));
        }

        const errorMessage = data?.message || `HTTP error ${response.status}: ${response.statusText}`;
        throw new ApiError(errorMessage, response.status, data);
      }

      return data;
    } catch (error) {
      if (!(error instanceof ApiError)) {
        console.error(`Network or API Error on ${url}:`, error);
      }
      throw error;
    }
  },

  get(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'GET', headers });
  },

  post(endpoint, body = {}, headers = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      headers,
    });
  },

  put(endpoint, body = {}, headers = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers,
    });
  },

  delete(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'DELETE', headers });
  },

  // Health check
  checkStatus() {
    return this.get('/status');
  },

  // Auth endpoints
  register(payload) {
    return this.post('/auth/register', payload);
  },

  login(credentials) {
    return this.post('/auth/login', credentials);
  },

  logout() {
    return this.post('/auth/logout');
  },

  getMe() {
    return this.get('/auth/me');
  },

  changePassword(passwords) {
    return this.post('/auth/change-password', passwords);
  },

  // Role endpoints
  getRoles() {
    return this.get('/roles');
  },

  // User management endpoints
  getUsers(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.role) query.append('role', params.role);
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', params.page);
    if (params.per_page) query.append('per_page', params.per_page);

    const queryString = query.toString();
    return this.get(`/users${queryString ? `?${queryString}` : ''}`);
  },

  getUser(id) {
    return this.get(`/users/${id}`);
  },

  createUser(payload) {
    return this.post('/users', payload);
  },

  updateUser(id, payload) {
    return this.put(`/users/${id}`, payload);
  },

  deleteUser(id) {
    return this.delete(`/users/${id}`);
  },

  assignRole(userId, role) {
    return this.post(`/users/${userId}/roles`, { role });
  },

  removeRole(userId, role) {
    return this.delete(`/users/${userId}/roles/${role}`);
  },

  // Member management endpoints (Module A)
  getMembers(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.gender) query.append('gender', params.gender);
    if (params.page) query.append('page', params.page);
    if (params.per_page) query.append('per_page', params.per_page);

    const queryString = query.toString();
    return this.get(`/members${queryString ? `?${queryString}` : ''}`);
  },

  getMember(id) {
    return this.get(`/members/${id}`);
  },

  createMember(payload) {
    return this.post('/members', payload);
  },

  updateMember(id, payload) {
    return this.put(`/members/${id}`, payload);
  },

  deleteMember(id) {
    return this.delete(`/members/${id}`);
  },

  regenerateMemberQr(id) {
    return this.post(`/members/${id}/regenerate-qr`);
  },

  // Audit Logs (Owner only)
  getAuditLogs(params = {}) {
    const query = new URLSearchParams();
    if (params.action) query.append('action', params.action);
    if (params.user_id) query.append('user_id', params.user_id);
    if (params.page) query.append('page', params.page);

    const queryString = query.toString();
    return this.get(`/audit-logs${queryString ? `?${queryString}` : ''}`);
  },

  // Membership Plans (Module C)
  getMembershipPlans(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.active_only) query.append('active_only', '1');

    const queryString = query.toString();
    return this.get(`/membership-plans${queryString ? `?${queryString}` : ''}`);
  },

  getMembershipPlan(id) {
    return this.get(`/membership-plans/${id}`);
  },

  createMembershipPlan(payload) {
    return this.post('/membership-plans', payload);
  },

  updateMembershipPlan(id, payload) {
    return this.put(`/membership-plans/${id}`, payload);
  },

  deleteMembershipPlan(id) {
    return this.delete(`/membership-plans/${id}`);
  },

  // Subscriptions (Module C)
  getSubscriptions(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.member_id) query.append('member_id', params.member_id);
    if (params.plan_id) query.append('plan_id', params.plan_id);
    if (params.page) query.append('page', params.page);
    if (params.per_page) query.append('per_page', params.per_page);

    const queryString = query.toString();
    return this.get(`/subscriptions${queryString ? `?${queryString}` : ''}`);
  },

  getSubscription(id) {
    return this.get(`/subscriptions/${id}`);
  },

  createSubscription(payload) {
    return this.post('/subscriptions', payload);
  },

  renewSubscription(id, payload = {}) {
    return this.post(`/subscriptions/${id}/renew`, payload);
  },

  freezeSubscription(id, payload) {
    return this.post(`/subscriptions/${id}/freeze`, payload);
  },

  unfreezeSubscription(id) {
    return this.post(`/subscriptions/${id}/unfreeze`);
  },

  cancelSubscription(id, payload) {
    return this.post(`/subscriptions/${id}/cancel`, payload);
  },
};

export default apiClient;
