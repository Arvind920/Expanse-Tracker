const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { generateSeedData } = require('../utils/seedData');

const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

class DatabaseService {
  constructor() {
    this.ensureInitialized();
  }

  ensureInitialized() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      const initialData = {
        transactions: [],
        budgets: {},
        goals: [],
        settings: { currency: '₹', theme: 'dark', dateFormat: 'YYYY-MM-DD' }
      };
      this.writeRaw(initialData);
    }
  }

  readRaw() {
    try {
      this.ensureInitialized();
      const content = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(content);
    } catch (err) {
      console.error('Error reading db.json:', err);
      const fallback = {
        transactions: [],
        budgets: {},
        goals: [],
        settings: { currency: '₹', theme: 'dark', dateFormat: 'YYYY-MM-DD' }
      };
      this.writeRaw(fallback);
      return fallback;
    }
  }

  writeRaw(data) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempFile, DB_FILE);
      return true;
    } catch (err) {
      console.error('Error writing to db.json:', err);
      return false;
    }
  }

  // Transaction operations
  getTransactions(filters = {}) {
    const data = this.readRaw();
    let results = [...data.transactions];

    if (filters.type && filters.type !== 'all') {
      results = results.filter(t => t.type.toLowerCase() === filters.type.toLowerCase());
    }

    if (filters.category && filters.category !== 'all') {
      results = results.filter(t => t.category.toLowerCase() === filters.category.toLowerCase());
    }

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      results = results.filter(t => 
        (t.note && t.note.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.paymentMethod && t.paymentMethod.toLowerCase().includes(q)) ||
        t.amount.toString().includes(q)
      );
    }

    if (filters.startDate) {
      results = results.filter(t => t.date >= filters.startDate);
    }

    if (filters.endDate) {
      results = results.filter(t => t.date <= filters.endDate);
    }

    // Sorting
    const sortBy = filters.sortBy || 'date';
    const order = filters.order === 'asc' ? 1 : -1;

    results.sort((a, b) => {
      if (sortBy === 'amount') {
        return (a.amount - b.amount) * order;
      }
      // default: date
      return (new Date(a.date) - new Date(b.date)) * order;
    });

    return results;
  }

  getTransactionById(id) {
    const data = this.readRaw();
    return data.transactions.find(t => t.id === id) || null;
  }

  addTransaction(txData) {
    const data = this.readRaw();
    const validTypes = ['income', 'expense', 'investment'];
    const type = validTypes.includes(txData.type) ? txData.type : 'expense';

    const newTx = {
      id: txData.id || `tx-${crypto.randomUUID().slice(0, 8)}`,
      type,
      amount: parseFloat(txData.amount) || 0,
      category: txData.category || 'Other',
      date: txData.date || new Date().toISOString().split('T')[0],
      paymentMethod: txData.paymentMethod || 'Credit Card',
      note: txData.note || '',
      createdAt: new Date().toISOString()
    };

    data.transactions.unshift(newTx);
    this.writeRaw(data);
    return newTx;
  }

  updateTransaction(id, updates) {
    const data = this.readRaw();
    const index = data.transactions.findIndex(t => t.id === id);
    if (index === -1) return null;

    const current = data.transactions[index];
    const updated = {
      ...current,
      ...updates,
      amount: updates.amount !== undefined ? parseFloat(updates.amount) : current.amount,
      updatedAt: new Date().toISOString()
    };

    data.transactions[index] = updated;
    this.writeRaw(data);
    return updated;
  }

  deleteTransaction(id) {
    const data = this.readRaw();
    const initialLen = data.transactions.length;
    data.transactions = data.transactions.filter(t => t.id !== id);
    if (data.transactions.length !== initialLen) {
      this.writeRaw(data);
      return true;
    }
    return false;
  }

  // Budgets
  getBudgets() {
    const data = this.readRaw();
    const budgets = data.budgets || {};
    
    // Calculate current month's spending for each category
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentMonthPrefix = `${currentYear}-${currentMonth}`;

    const currentMonthExpenses = data.transactions.filter(t => 
      t.type === 'expense' && t.date && t.date.startsWith(currentMonthPrefix)
    );

    const spentByCategory = {};
    currentMonthExpenses.forEach(t => {
      spentByCategory[t.category] = (spentByCategory[t.category] || 0) + Number(t.amount);
    });

    const budgetList = Object.entries(budgets).map(([category, limit]) => {
      const spent = spentByCategory[category] || 0;
      const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      return {
        category,
        limit,
        spent: Math.round(spent * 100) / 100,
        remaining: Math.max(0, Math.round((limit - spent) * 100) / 100),
        percentage
      };
    });

    return budgetList;
  }

  updateBudget(category, limit) {
    const data = this.readRaw();
    if (!data.budgets) data.budgets = {};
    data.budgets[category] = parseFloat(limit) || 0;
    this.writeRaw(data);
    return this.getBudgets();
  }

  deleteBudget(category) {
    const data = this.readRaw();
    if (data.budgets && data.budgets[category] !== undefined) {
      delete data.budgets[category];
      this.writeRaw(data);
      return true;
    }
    return false;
  }

  // Goals
  getGoals() {
    const data = this.readRaw();
    return data.goals || [];
  }

  addGoal(goalData) {
    const data = this.readRaw();
    if (!data.goals) data.goals = [];
    const newGoal = {
      id: `goal-${crypto.randomUUID().slice(0, 8)}`,
      name: goalData.name || 'New Goal',
      targetAmount: parseFloat(goalData.targetAmount) || 1000,
      currentAmount: parseFloat(goalData.currentAmount) || 0,
      category: goalData.category || 'Savings',
      targetDate: goalData.targetDate || '',
      color: goalData.color || '#10B981',
      createdAt: new Date().toISOString()
    };
    data.goals.push(newGoal);
    this.writeRaw(data);
    return newGoal;
  }

  updateGoal(id, updates) {
    const data = this.readRaw();
    if (!data.goals) return null;
    const index = data.goals.findIndex(g => g.id === id);
    if (index === -1) return null;

    data.goals[index] = {
      ...data.goals[index],
      ...updates,
      targetAmount: updates.targetAmount !== undefined ? parseFloat(updates.targetAmount) : data.goals[index].targetAmount,
      currentAmount: updates.currentAmount !== undefined ? parseFloat(updates.currentAmount) : data.goals[index].currentAmount
    };
    this.writeRaw(data);
    return data.goals[index];
  }

  deleteGoal(id) {
    const data = this.readRaw();
    if (!data.goals) return false;
    const initialLen = data.goals.length;
    data.goals = data.goals.filter(g => g.id !== id);
    if (data.goals.length !== initialLen) {
      this.writeRaw(data);
      return true;
    }
    return false;
  }

  // Settings
  getSettings() {
    const data = this.readRaw();
    return data.settings || { currency: '₹', theme: 'dark' };
  }

  updateSettings(updates) {
    const data = this.readRaw();
    data.settings = { ...data.settings, ...updates };
    this.writeRaw(data);
    return data.settings;
  }

  // Statistics calculation for Dashboard
  getStats() {
    const data = this.readRaw();
    const transactions = data.transactions || [];

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentMonthPrefix = `${currentYear}-${currentMonth}`;

    let totalIncomeAllTime = 0;
    let totalExpenseAllTime = 0;
    let totalInvestmentAllTime = 0;
    let thisMonthIncome = 0;
    let thisMonthExpense = 0;
    let thisMonthInvestment = 0;

    const categoryBreakdown = {};
    const investmentBreakdown = {};

    transactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      const isThisMonth = t.date && t.date.startsWith(currentMonthPrefix);

      if (t.type === 'income') {
        totalIncomeAllTime += amt;
        if (isThisMonth) thisMonthIncome += amt;
      } else if (t.type === 'investment') {
        totalInvestmentAllTime += amt;
        if (isThisMonth) {
          thisMonthInvestment += amt;
          categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + amt;
          investmentBreakdown[t.category] = (investmentBreakdown[t.category] || 0) + amt;
        }
      } else {
        totalExpenseAllTime += amt;
        if (isThisMonth) {
          thisMonthExpense += amt;
          categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + amt;
        }
      }
    });

    const netCashBalance = totalIncomeAllTime - totalExpenseAllTime - totalInvestmentAllTime;
    const totalNetWorth = totalIncomeAllTime - totalExpenseAllTime;
    const thisMonthSavings = thisMonthIncome - thisMonthExpense - thisMonthInvestment;
    const savingsRate = thisMonthIncome > 0 ? Math.round(((thisMonthSavings + thisMonthInvestment) / thisMonthIncome) * 100) : 0;

    // Monthly cashflow for last 6 months
    const monthlyCashFlow = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const prefix = `${y}-${m}`;
      const monthLabel = d.toLocaleString('default', { month: 'short' });

      let inc = 0;
      let exp = 0;
      let inv = 0;
      transactions.forEach(t => {
        if (t.date && t.date.startsWith(prefix)) {
          if (t.type === 'income') inc += Number(t.amount);
          else if (t.type === 'investment') inv += Number(t.amount);
          else exp += Number(t.amount);
        }
      });

      monthlyCashFlow.push({
        month: monthLabel,
        key: prefix,
        income: Math.round(inc * 100) / 100,
        expense: Math.round(exp * 100) / 100,
        investment: Math.round(inv * 100) / 100,
        savings: Math.round((inc - exp - inv) * 100) / 100
      });
    }

    // Format category breakdown array with percentages
    const categoryArray = Object.entries(categoryBreakdown).map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
      percentage: (thisMonthExpense + thisMonthInvestment) > 0 ? Math.round((amount / (thisMonthExpense + thisMonthInvestment)) * 100) : 0
    })).sort((a, b) => b.amount - a.amount);

    const investmentArray = Object.entries(investmentBreakdown).map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
      percentage: thisMonthInvestment > 0 ? Math.round((amount / thisMonthInvestment) * 100) : 0
    })).sort((a, b) => b.amount - a.amount);

    return {
      netBalance: Math.round(netCashBalance * 100) / 100,
      totalNetWorth: Math.round(totalNetWorth * 100) / 100,
      thisMonthIncome: Math.round(thisMonthIncome * 100) / 100,
      thisMonthExpense: Math.round(thisMonthExpense * 100) / 100,
      thisMonthInvestment: Math.round(thisMonthInvestment * 100) / 100,
      thisMonthSavings: Math.round(thisMonthSavings * 100) / 100,
      savingsRate,
      totalIncomeAllTime: Math.round(totalIncomeAllTime * 100) / 100,
      totalExpenseAllTime: Math.round(totalExpenseAllTime * 100) / 100,
      totalInvestmentAllTime: Math.round(totalInvestmentAllTime * 100) / 100,
      categoryBreakdown: categoryArray,
      investmentBreakdown: investmentArray,
      monthlyCashFlow,
      transactionCount: transactions.length
    };
  }

  // Reset to seed data
  resetToSeed() {
    const seed = generateSeedData();
    this.writeRaw(seed);
    return seed;
  }
}

module.exports = new DatabaseService();
