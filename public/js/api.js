// FlowExpense - API Service Layer
const API_BASE = '/api';

const api = {
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (!response.ok) {
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
