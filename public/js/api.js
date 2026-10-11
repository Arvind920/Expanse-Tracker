// FlowExpense - API Service Layer
const API_BASE = '/api';
const TOKEN_KEY = 'flowexpense_token';

const api = {
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

  isAuthenticated() {
    return !!this.getToken();
  },

  async request(endpoint, options = {}) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (!response.ok) {
          if (response.status === 401 && !endpoint.startsWith('/auth')) {
            // Token expired or invalid
            window.dispatchEvent(new CustomEvent('auth:expired'));
          }
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
        return data;
      }
      return response;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  },

  // Authentication
  async register(userData) {
    const res = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  },

  async login(credentials) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  },

  async getCurrentUser() {
    if (!this.getToken()) return null;
    try {
      const res = await this.request('/auth/me');
      return res.user;
    } catch {
      this.clearToken();
      return null;
    }
  },

  async updateUserPreferences(prefs) {
    const res = await this.request('/auth/preferences', {
      method: 'POST',
      body: JSON.stringify(prefs)
    });
    return res.user;
  },

  // Stats
  async getStats() {
    const res = await this.request('/stats');
    return res.data;
  },

  // Transactions
  async getTransactions(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });
    const res = await this.request(`/transactions?${query.toString()}`);
    return res.data || [];
  },

  async addTransaction(txData) {
    const res = await this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(txData)
    });
    return res.data;
  },

  async updateTransaction(id, txData) {
    const res = await this.request(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(txData)
    });
    return res.data;
  },

  async deleteTransaction(id) {
    const res = await this.request(`/transactions/${id}`, {
      method: 'DELETE'
    });
    return res;
  },

  // Budgets
  async getBudgets() {
    const res = await this.request('/budgets');
    return res.data || [];
  },

  async updateBudget(category, limit) {
    const res = await this.request('/budgets', {
      method: 'POST',
      body: JSON.stringify({ category, limit })
    });
    return res.data;
  },

  // Goals
  async getGoals() {
    const res = await this.request('/goals');
    return res.data || [];
  },

  async addGoal(goalData) {
    const res = await this.request('/goals', {
      method: 'POST',
      body: JSON.stringify(goalData)
    });
    return res.data;
  },

  async updateGoal(id, updates) {
    const res = await this.request(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return res.data;
  },

  async deleteGoal(id) {
    const res = await this.request(`/goals/${id}`, {
      method: 'DELETE'
    });
    return res;
  },

  // Data Tools
  async seedDemoData() {
    const res = await this.request('/seed', { method: 'POST' });
    return res;
  },

  async importBackup(backupJson) {
    const res = await this.request('/import', {
      method: 'POST',
      body: JSON.stringify(backupJson)
    });
    return res;
  },

  // Settings
  async getSettings() {
    const res = await this.request('/settings');
    return res.data;
  },

  async updateSettings(settings) {
    const res = await this.request('/settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    });
    return res.data;
  }
};
