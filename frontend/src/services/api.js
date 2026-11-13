/**
 * GymCore API Client Service
 * Centralized API client configured with environment variables
 */

const RAW_API_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
// Resolve localhost to 127.0.0.1 on Windows to bypass the 1s IPv6 (::1) DNS fallback timeout
const API_BASE_URL = RAW_API_URL.replace('//localhost:', '//127.0.0.1:');
const TOKEN_KEY = 'gymcore_token';

// In-flight request deduplication and ultra-fast client cache (4s TTL)
const inFlightRequests = new Map();
const getCache = new Map();
const CACHE_TTL_MS = 4000;

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
    getCache.clear();
  },

  async request(endpoint, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    // Mutations invalidate cached GET reads
    if (method !== 'GET') {
      getCache.clear();
    }

    // Check fast cache for GET requests
    const isForceRefresh = endpoint.includes('refresh=1') || options.noCache;
    if (method === 'GET' && !isForceRefresh) {
      const cached = getCache.get(url);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.data;
      }

      // Share identical in-flight requests
      if (inFlightRequests.has(url)) {
        return inFlightRequests.get(url);
      }
    }

    const token = this.getToken();
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

    const headers = {
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers,
    };

    const fetchPromise = (async () => {
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

        if (method === 'GET' && !isForceRefresh && data) {
          getCache.set(url, { timestamp: Date.now(), data });
        }

        return data;
      } catch (error) {
        if (!(error instanceof ApiError)) {
          console.error(`Network or API Error on ${url}:`, error);
        }
        throw error;
      } finally {
        if (method === 'GET') {
          inFlightRequests.delete(url);
        }
      }
    })();

    if (method === 'GET' && !isForceRefresh) {
      inFlightRequests.set(url, fetchPromise);
    }

    return fetchPromise;
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

  async downloadBlob(endpoint, fallbackFilename = 'document.pdf') {
    const token = this.getToken();
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const response = await fetch(url, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      throw new ApiError(errJson?.message || `Failed to download file (HTTP ${response.status})`, response.status, errJson);
    }
    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition');
    let filename = fallbackFilename;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];
    }
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    return true;
  },

  // Health check
  checkStatus() {
    return this.get('/status');
  },

  // Auth endpoints
  login(credentials) {
    return this.post('/auth/login', credentials);
  },

  logout() {
    return this.post('/auth/logout');
  },

  getMe() {
    return this.get('/auth/me');
  },

  updateProfile(data) {
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      return this.request('/auth/profile', {
        method: 'POST',
        body: data,
      });
    }
    return this.post('/auth/profile', data);
  },

  changePassword(passwords) {
    return this.post('/auth/change-password', passwords);
  },

  // Role endpoints
  getRoles() {
    return this.get('/roles');
  },

  // Reception Overview Dashboard (Dedicated Operational Aggregation)
  getReceptionDashboard(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/reception/dashboard${query ? `?${query}` : ''}`);
  },

  // User management endpoints
  getUsers(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.role) query.append('role', params.role);
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', params.page);
    if (params.per_page) query.append('per_page', params.per_page);
    if (params.all) query.append('all', '1');

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
    if (params.all) query.append('all', '1');

    const queryString = query.toString();
    return this.get(`/members${queryString ? `?${queryString}` : ''}`);
  },

  getMember(id) {
    return this.get(`/members/${id}`);
  },

  createMember(payload) {
    return this.post('/members', payload);
  },

  checkContactAvailability(params = {}) {
    const query = new URLSearchParams();
    if (params.phone) query.append('phone', params.phone);
    if (params.email) query.append('email', params.email);
    if (params.exclude_user_id) query.append('exclude_user_id', params.exclude_user_id);
    return this.get(`/members/check-contact?${query.toString()}`);
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

  sendMemberCardEmail(id) {
    return this.post(`/members/${id}/send-card-email`);
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
    if (params.all) query.append('all', '1');

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

  // Module D: Payments & Financial Ledger
  getPayments(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.payment_method) query.append('payment_method', params.payment_method);
    if (params.payment_type) query.append('payment_type', params.payment_type);
    if (params.member_id) query.append('member_id', params.member_id);
    if (params.date_from) query.append('date_from', params.date_from);
    if (params.date_to) query.append('date_to', params.date_to);
    if (params.page) query.append('page', params.page);
    if (params.per_page) query.append('per_page', params.per_page);
    if (params.all) query.append('all', '1');

    const queryString = query.toString();
    return this.get(`/payments${queryString ? `?${queryString}` : ''}`);
  },

  getPayment(id) {
    return this.get(`/payments/${id}`);
  },

  createPayment(payload) {
    return this.post('/payments', payload);
  },

  refundPayment(id, payload) {
    return this.post(`/payments/${id}/refund`, payload);
  },

  sendPaymentReceiptEmail(id) {
    return this.post(`/payments/${id}/send-receipt-email`);
  },

  getPaymentSummary() {
    return this.get('/payments/summary');
  },

  getPaymentMonthlySummary() {
    return this.get('/payments/monthly-summary');
  },

  initializeChapa(payload) {
    return this.post('/payments/chapa/initialize', payload);
  },

  verifyChapa(payload) {
    return this.post('/payments/chapa/verify', payload);
  },

  // Document Deliveries (Card & Receipt PDFs)
  getDocumentDeliveries(params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.payment_id) query.append('payment_id', params.payment_id);
    if (params.user_id) query.append('user_id', params.user_id);
    if (params.page) query.append('page', params.page);
    if (params.per_page) query.append('per_page', params.per_page);
    if (params.all) query.append('all', '1');

    const queryString = query.toString();
    return this.get(`/document-deliveries${queryString ? `?${queryString}` : ''}`);
  },

  getDocumentDelivery(id) {
    return this.get(`/document-deliveries/${id}`);
  },

  resendDocumentDelivery(id, payload = {}) {
    return this.post(`/document-deliveries/${id}/resend`, payload);
  },

  async downloadDeliveryCard(id, fallbackFilename = 'TigatGym-Membership-Card.pdf') {
    return this.downloadBlob(`/document-deliveries/${id}/download/card`, fallbackFilename);
  },

  async downloadDeliveryReceipt(id, fallbackFilename = 'TigatGym-Payment-Receipt.pdf') {
    return this.downloadBlob(`/document-deliveries/${id}/download/receipt`, fallbackFilename);
  },

  // Expenses & Outflows
  getExpenses(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category) query.append('category', params.category);
    if (params.status) query.append('status', params.status);
    if (params.payment_method) query.append('payment_method', params.payment_method);
    if (params.date_from) query.append('date_from', params.date_from);
    if (params.date_to) query.append('date_to', params.date_to);
    if (params.page) query.append('page', params.page);
    if (params.per_page) query.append('per_page', params.per_page);
    if (params.all) query.append('all', '1');

    const queryString = query.toString();
    return this.get(`/expenses${queryString ? `?${queryString}` : ''}`);
  },

  getExpense(id) {
    return this.get(`/expenses/${id}`);
  },

  createExpense(payload) {
    return this.post('/expenses', payload);
  },

  updateExpense(id, payload) {
    return this.put(`/expenses/${id}`, payload);
  },

  approveExpense(id) {
    return this.post(`/expenses/${id}/approve`);
  },

  deleteExpense(id) {
    return this.delete(`/expenses/${id}`);
  },

  getExpenseSummary() {
    return this.get('/expenses/summary');
  },

  // Module E: Attendance & QR Check-in
  getAttendance(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.method) query.append('method', params.method);
    if (params.member_id) query.append('member_id', params.member_id);
    if (params.date) query.append('date', params.date);
    if (params.date_from) query.append('date_from', params.date_from);
    if (params.date_to) query.append('date_to', params.date_to);
    if (params.currently_inside) query.append('currently_inside', '1');
    if (params.page) query.append('page', params.page);
    if (params.per_page) query.append('per_page', params.per_page);
    if (params.all) query.append('all', '1');

    const queryString = query.toString();
    return this.get(`/attendance${queryString ? `?${queryString}` : ''}`);
  },

  getAttendanceSummary() {
    return this.get('/attendance/summary');
  },

  lookupMember(searchQuery) {
    const query = new URLSearchParams({ query: searchQuery });
    return this.get(`/attendance/lookup?${query.toString()}`);
  },

  checkIn(payload) {
    return this.post('/attendance/check-in', payload);
  },

  checkOut(payload) {
    return this.post('/attendance/check-out', payload);
  },

  updateAttendance(id, payload) {
    return this.put(`/attendance/${id}`, payload);
  },

  // Module B: Trainer Management & PT Sessions
  getTrainers(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    const queryString = query.toString();
    return this.get(`/trainers${queryString ? `?${queryString}` : ''}`);
  },

  createTrainer(payload) {
    return this.post('/trainers', payload);
  },

  assignTrainer(payload) {
    return this.post('/trainers/assign', payload);
  },

  getTrainingSessions(params = {}) {
    const query = new URLSearchParams();
    if (params.trainer_id) query.append('trainer_id', params.trainer_id);
    if (params.status) query.append('status', params.status);
    const queryString = query.toString();
    return this.get(`/trainers/sessions${queryString ? `?${queryString}` : ''}`);
  },

  scheduleTrainingSession(payload) {
    return this.post('/trainers/sessions', payload);
  },

  // Module G: Fitness Classes & Reservations
  getFitnessClasses(params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.date) query.append('date', params.date);
    const queryString = query.toString();
    return this.get(`/classes${queryString ? `?${queryString}` : ''}`);
  },

  createFitnessClass(payload) {
    return this.post('/classes', payload);
  },

  bookFitnessClass(classId, payload = {}) {
    return this.post(`/classes/${classId}/book`, payload);
  },

  cancelFitnessClassBooking(classId, payload = {}) {
    return this.post(`/classes/${classId}/cancel-booking`, payload);
  },

  // Module F: Workouts & Exercise Library
  getExercises(params = {}) {
    const query = new URLSearchParams();
    if (params.muscle_group) query.append('muscle_group', params.muscle_group);
    if (params.category) query.append('category', params.category);
    if (params.search) query.append('search', params.search);
    const queryString = query.toString();
    return this.get(`/exercises${queryString ? `?${queryString}` : ''}`);
  },

  createExercise(payload) {
    return this.post('/exercises', payload);
  },

  getWorkoutPlans() {
    return this.get('/workouts/plans');
  },

  createWorkoutPlan(payload) {
    return this.post('/workouts/plans', payload);
  },

  logWorkoutSet(payload) {
    return this.post('/workouts/logs', payload);
  },

  getWorkoutLogs(params = {}) {
    const query = new URLSearchParams();
    if (params.member_id) query.append('member_id', params.member_id);
    const queryString = query.toString();
    return this.get(`/workouts/logs${queryString ? `?${queryString}` : ''}`);
  },

  // Module H: Equipment & Maintenance Inventory
  getEquipment(params = {}) {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    const queryString = query.toString();
    return this.get(`/equipment${queryString ? `?${queryString}` : ''}`);
  },

  createEquipment(payload) {
    return this.post('/equipment', payload);
  },

  updateEquipment(id, payload) {
    return this.put(`/equipment/${id}`, payload);
  },

  deleteEquipment(id) {
    return this.delete(`/equipment/${id}`);
  },
};

export default apiClient;
