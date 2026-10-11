const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { isMongoConnected } = require('../config/db');

// Mongoose models
const UserModel = require('../models/User');
const TransactionModel = require('../models/Transaction');
const BudgetModel = require('../models/Budget');
const GoalModel = require('../models/Goal');

const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

class UnifiedDatabaseService {
  constructor() {
    this.ensureLocalInitialized();
  }

  ensureLocalInitialized() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify({ transactions: [], budgets: {}, goals: [], settings: { currency: '₹', theme: 'dark' } }, null, 2));
    }
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
    }
  }

  readLocal(file) {
    try {
      this.ensureLocalInitialized();
      const content = fs.readFileSync(file, 'utf8');
      return JSON.parse(content);
    } catch {
      return file === USERS_FILE ? [] : { transactions: [], budgets: {}, goals: [], settings: {} };
    }
  }

  writeLocal(file, data) {
    try {
      const temp = `${file}.tmp.${Date.now()}`;
      fs.writeFileSync(temp, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(temp, file);
      return true;
    } catch (err) {
      console.error(`Error writing to ${file}:`, err);
      return false;
    }
  }

  // ==========================================
  // USER OPERATIONS
  // ==========================================
  async findUserByEmail(email) {
    const cleanEmail = email.toLowerCase().trim();
    if (isMongoConnected()) {
      return await UserModel.findOne({ email: cleanEmail });
    }
    const users = this.readLocal(USERS_FILE);
    return users.find(u => u.email === cleanEmail) || null;
  }

  async findUserById(id) {
    if (isMongoConnected()) {
      return await UserModel.findById(id).select('-password');
    }
    const users = this.readLocal(USERS_FILE);
    const user = users.find(u => u.id === id);
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async createUser({ name, email, password, currency = '₹', theme = 'dark' }) {
    const cleanEmail = email.toLowerCase().trim();
    const hashedPassword = await bcrypt.hash(password, 10);

    if (isMongoConnected()) {
      const newUser = await UserModel.create({
        name,
        email: cleanEmail,
        password: hashedPassword,
        currency,
        theme
      });
      return {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        currency: newUser.currency,
        theme: newUser.theme
      };
    }

    const users = this.readLocal(USERS_FILE);
    const id = `usr-${crypto.randomUUID().slice(0, 8)}`;
    const user = {
      id,
      name,
      email: cleanEmail,
      password: hashedPassword,
      currency,
      theme,
      createdAt: new Date().toISOString()
    };
    users.push(user);
    this.writeLocal(USERS_FILE, users);

    // If local db.json has unassigned transactions, assign them to this first user!
    const dbData = this.readLocal(DB_FILE);
    let modified = false;
    if (dbData.transactions) {
      dbData.transactions.forEach(t => {
        if (!t.userId) {
          t.userId = id;
          modified = true;
        }
      });
    }
    if (modified) {
      this.writeLocal(DB_FILE, dbData);
    }

    return { id: user.id, name: user.name, email: user.email, currency: user.currency, theme: user.theme };
  }

  // ==========================================
  // TRANSACTION OPERATIONS (Scoped to User)
  // ==========================================
  async getTransactions(userId, filters = {}) {
    if (isMongoConnected()) {
      const query = { userId };
      if (filters.type && filters.type !== 'all') query.type = filters.type;
      if (filters.category && filters.category !== 'all') query.category = filters.category;
      if (filters.startDate) query.date = { ...query.date, $gte: filters.startDate };
      if (filters.endDate) query.date = { ...query.date, $lte: filters.endDate };
      if (filters.search) {
        query.$or = [
          { note: { $regex: filters.search, $options: 'i' } },
          { category: { $regex: filters.search, $options: 'i' } },
          { paymentMethod: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const sortField = filters.sortBy === 'amount' ? 'amount' : 'date';
      const sortOrder = filters.order === 'asc' ? 1 : -1;
      const txs = await TransactionModel.find(query).sort({ [sortField]: sortOrder });
      return txs.map(t => ({
        id: t._id.toString(),
        userId: t.userId,
        type: t.type,
        amount: t.amount,
        category: t.category,
        date: t.date,
        paymentMethod: t.paymentMethod,
        note: t.note,
        createdAt: t.createdAt
      }));
    }

    // Local Fallback
    const dbData = this.readLocal(DB_FILE);
    let results = (dbData.transactions || []).filter(t => !t.userId || t.userId === userId);

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

    if (filters.startDate) results = results.filter(t => t.date >= filters.startDate);
    if (filters.endDate) results = results.filter(t => t.date <= filters.endDate);

    const sortBy = filters.sortBy || 'date';
    const order = filters.order === 'asc' ? 1 : -1;

    results.sort((a, b) => {
      if (sortBy === 'amount') return (a.amount - b.amount) * order;
      return (new Date(a.date) - new Date(b.date)) * order;
    });

    return results;
  }

  async getTransactionById(id, userId) {
    if (isMongoConnected()) {
      const t = await TransactionModel.findOne({ _id: id, userId });
      if (!t) return null;
      return {
        id: t._id.toString(),
        userId: t.userId,
        type: t.type,
        amount: t.amount,
        category: t.category,
        date: t.date,
        paymentMethod: t.paymentMethod,
        note: t.note
      };
    }
    const dbData = this.readLocal(DB_FILE);
    return (dbData.transactions || []).find(t => t.id === id && (!t.userId || t.userId === userId)) || null;
  }

  async addTransaction(userId, txData) {
    const validTypes = ['income', 'expense', 'investment'];
    const type = validTypes.includes(txData.type) ? txData.type : 'expense';
    const amount = parseFloat(txData.amount) || 0;
    const category = txData.category || 'Other';
    const date = txData.date || new Date().toISOString().split('T')[0];
    const paymentMethod = txData.paymentMethod || 'Credit Card';
    const note = txData.note || '';

    if (isMongoConnected()) {
      const t = await TransactionModel.create({
        userId,
        type,
        amount,
        category,
        date,
        paymentMethod,
        note
      });
      return {
        id: t._id.toString(),
        userId: t.userId,
        type: t.type,
        amount: t.amount,
        category: t.category,
        date: t.date,
        paymentMethod: t.paymentMethod,
        note: t.note,
        createdAt: t.createdAt
      };
    }

    const dbData = this.readLocal(DB_FILE);
    const newTx = {
      id: txData.id || `tx-${crypto.randomUUID().slice(0, 8)}`,
      userId,
      type,
      amount,
      category,
      date,
      paymentMethod,
      note,
      createdAt: new Date().toISOString()
    };
    dbData.transactions = dbData.transactions || [];
    dbData.transactions.unshift(newTx);
    this.writeLocal(DB_FILE, dbData);
    return newTx;
  }

  async updateTransaction(id, userId, updates) {
    if (isMongoConnected()) {
      const t = await TransactionModel.findOneAndUpdate(
        { _id: id, userId },
        { ...updates },
        { new: true }
      );
      if (!t) return null;
      return {
        id: t._id.toString(),
        userId: t.userId,
        type: t.type,
        amount: t.amount,
        category: t.category,
        date: t.date,
        paymentMethod: t.paymentMethod,
        note: t.note
      };
    }

    const dbData = this.readLocal(DB_FILE);
    const index = (dbData.transactions || []).findIndex(t => t.id === id && (!t.userId || t.userId === userId));
    if (index === -1) return null;

    const current = dbData.transactions[index];
    const updated = {
      ...current,
      ...updates,
      userId,
      amount: updates.amount !== undefined ? parseFloat(updates.amount) : current.amount,
      updatedAt: new Date().toISOString()
    };
    dbData.transactions[index] = updated;
    this.writeLocal(DB_FILE, dbData);
    return updated;
  }

  async deleteTransaction(id, userId) {
    if (isMongoConnected()) {
      const res = await TransactionModel.findOneAndDelete({ _id: id, userId });
      return !!res;
    }

    const dbData = this.readLocal(DB_FILE);
    const initialLen = (dbData.transactions || []).length;
    dbData.transactions = (dbData.transactions || []).filter(t => !(t.id === id && (!t.userId || t.userId === userId)));
    if (dbData.transactions.length !== initialLen) {
      this.writeLocal(DB_FILE, dbData);
      return true;
    }
    return false;
  }

  // ==========================================
  // BUDGET OPERATIONS (Scoped to User)
  // ==========================================
  async getBudgets(userId) {
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let budgetsObj = {};

    if (isMongoConnected()) {
      const budgets = await BudgetModel.find({ userId });
      budgets.forEach(b => { budgetsObj[b.category] = b.limit; });
    } else {
      const dbData = this.readLocal(DB_FILE);
      budgetsObj = (dbData.userBudgets && dbData.userBudgets[userId]) || dbData.budgets || {};
    }

    // Calculate current month's spending
    const transactions = await this.getTransactions(userId);
    const currentMonthExpenses = transactions.filter(t =>
      t.type === 'expense' && t.date && t.date.startsWith(currentMonthPrefix)
    );

    const spentByCategory = {};
    currentMonthExpenses.forEach(t => {
      spentByCategory[t.category] = (spentByCategory[t.category] || 0) + Number(t.amount);
    });

    return Object.entries(budgetsObj).map(([category, limit]) => {
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
  }

  async updateBudget(userId, category, limit) {
    const numLimit = parseFloat(limit) || 0;
    if (isMongoConnected()) {
      await BudgetModel.findOneAndUpdate(
        { userId, category },
        { limit: numLimit },
        { upsert: true, new: true }
      );
      return await this.getBudgets(userId);
    }

    const dbData = this.readLocal(DB_FILE);
    if (!dbData.userBudgets) dbData.userBudgets = {};
    if (!dbData.userBudgets[userId]) dbData.userBudgets[userId] = {};
    dbData.userBudgets[userId][category] = numLimit;
    this.writeLocal(DB_FILE, dbData);
    return await this.getBudgets(userId);
  }

  async deleteBudget(userId, category) {
    if (isMongoConnected()) {
      const res = await BudgetModel.findOneAndDelete({ userId, category });
      return !!res;
    }
    const dbData = this.readLocal(DB_FILE);
    if (dbData.userBudgets && dbData.userBudgets[userId] && dbData.userBudgets[userId][category] !== undefined) {
      delete dbData.userBudgets[userId][category];
      this.writeLocal(DB_FILE, dbData);
      return true;
    }
    return false;
  }

  // ==========================================
  // GOAL OPERATIONS (Scoped to User)
  // ==========================================
  async getGoals(userId) {
    if (isMongoConnected()) {
      const goals = await GoalModel.find({ userId });
      return goals.map(g => ({
        id: g._id.toString(),
        userId: g.userId,
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        category: g.category,
        targetDate: g.targetDate,
        color: g.color
      }));
    }

    const dbData = this.readLocal(DB_FILE);
    return (dbData.goals || []).filter(g => !g.userId || g.userId === userId);
  }

  async addGoal(userId, goalData) {
    const newGoalData = {
      userId,
      name: goalData.name || 'New Goal',
      targetAmount: parseFloat(goalData.targetAmount) || 1000,
      currentAmount: parseFloat(goalData.currentAmount) || 0,
      category: goalData.category || 'Savings',
      targetDate: goalData.targetDate || '',
      color: goalData.color || '#10B981'
    };

    if (isMongoConnected()) {
      const g = await GoalModel.create(newGoalData);
      return { id: g._id.toString(), ...newGoalData };
    }

    const dbData = this.readLocal(DB_FILE);
    const newGoal = {
      id: `goal-${crypto.randomUUID().slice(0, 8)}`,
      ...newGoalData,
      createdAt: new Date().toISOString()
    };
    dbData.goals = dbData.goals || [];
    dbData.goals.push(newGoal);
    this.writeLocal(DB_FILE, dbData);
    return newGoal;
  }

  async updateGoal(id, userId, updates) {
    if (isMongoConnected()) {
      const g = await GoalModel.findOneAndUpdate(
        { _id: id, userId },
        { ...updates },
        { new: true }
      );
      if (!g) return null;
      return { id: g._id.toString(), ...g.toObject() };
    }

    const dbData = this.readLocal(DB_FILE);
    const index = (dbData.goals || []).findIndex(g => g.id === id && (!g.userId || g.userId === userId));
    if (index === -1) return null;

    dbData.goals[index] = {
      ...dbData.goals[index],
      ...updates,
      userId
    };
    this.writeLocal(DB_FILE, dbData);
    return dbData.goals[index];
  }

  async deleteGoal(id, userId) {
    if (isMongoConnected()) {
      const res = await GoalModel.findOneAndDelete({ _id: id, userId });
      return !!res;
    }

    const dbData = this.readLocal(DB_FILE);
    const initialLen = (dbData.goals || []).length;
    dbData.goals = (dbData.goals || []).filter(g => !(g.id === id && (!g.userId || g.userId === userId)));
    if (dbData.goals.length !== initialLen) {
      this.writeLocal(DB_FILE, dbData);
      return true;
    }
    return false;
  }

  // ==========================================
  // FINANCIAL STATS CALCULATION (Scoped to User)
  // ==========================================
  async getStats(userId) {
    const transactions = await this.getTransactions(userId);

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

  // User Settings
  async getSettings(userId) {
    const user = await this.findUserById(userId);
    return {
      currency: user?.currency || '₹',
      theme: user?.theme || 'dark'
    };
  }

  async updateUserSettings(userId, updates) {
    if (isMongoConnected()) {
      return await UserModel.findByIdAndUpdate(userId, updates, { new: true });
    }
    const users = this.readLocal(USERS_FILE);
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      this.writeLocal(USERS_FILE, users);
      return users[index];
    }
    return null;
  }

  // Seed sample data for user
  async seedUserData(userId) {
    const today = new Date();
    const currentMonth = today.toISOString().split('T')[0].substring(0, 7);
    
    // Sample transactions for a realistic Indian personal finance portfolio
    const sampleTxs = [
      { type: 'income', amount: 85000, category: 'Salary', date: `${currentMonth}-01`, paymentMethod: 'Bank Transfer', note: 'Monthly Salary Credit' },
      { type: 'income', amount: 12000, category: 'Freelance', date: `${currentMonth}-05`, paymentMethod: 'UPI', note: 'Web App Consultation' },
      { type: 'income', amount: 3500, category: 'Dividends', date: `${currentMonth}-10`, paymentMethod: 'Bank Transfer', note: 'Quarterly Stock Dividend' },
      
      { type: 'expense', amount: 22000, category: 'Housing & Rent', date: `${currentMonth}-02`, paymentMethod: 'Net Banking', note: 'Apartment Monthly Rent' },
      { type: 'expense', amount: 14500, category: 'EMIs & Loans', date: `${currentMonth}-05`, paymentMethod: 'Auto Debit', note: 'HDFC Car Loan EMI' },
      { type: 'expense', amount: 6200, category: 'Food & Dining', date: `${currentMonth}-06`, paymentMethod: 'UPI', note: 'Grocery Mart & Provisions' },
      { type: 'expense', amount: 2400, category: 'Utilities & Bills', date: `${currentMonth}-08`, paymentMethod: 'UPI', note: 'Electricity & Broadband Bill' },
      { type: 'expense', amount: 3800, category: 'Transportation', date: `${currentMonth}-09`, paymentMethod: 'Credit Card', note: 'Monthly Fuel' },
      { type: 'expense', amount: 1950, category: 'Entertainment', date: `${currentMonth}-11`, paymentMethod: 'Credit Card', note: 'OTT & Movie Tickets' },
      
      { type: 'investment', amount: 15000, category: 'SIP & Mutual Funds', date: `${currentMonth}-03`, paymentMethod: 'Auto Debit', note: 'Nifty 50 Index Fund SIP' },
      { type: 'investment', amount: 10000, category: 'Share Market & Stocks', date: `${currentMonth}-07`, paymentMethod: 'Net Banking', note: 'Bluechip Equity Portfolio' },
      { type: 'investment', amount: 5000, category: 'Recurring Deposit (RD)', date: `${currentMonth}-10`, paymentMethod: 'Auto Debit', note: 'SBI Monthly RD' }
    ];

    for (const tx of sampleTxs) {
      await this.addTransaction(userId, tx);
    }

    // Default budgets
    await this.updateBudget(userId, 'Food & Dining', 12000);
    await this.updateBudget(userId, 'Housing & Rent', 25000);
    await this.updateBudget(userId, 'EMIs & Loans', 15000);
    await this.updateBudget(userId, 'Transportation', 6000);
    await this.updateBudget(userId, 'Entertainment', 4000);
    await this.updateBudget(userId, 'Utilities & Bills', 5000);

    // Default goals
    await this.addGoal(userId, {
      name: 'Emergency Fund',
      targetAmount: 300000,
      currentAmount: 180000,
      category: 'Savings',
      targetDate: `${today.getFullYear() + 1}-03-31`,
      color: '#10B981'
    });
    await this.addGoal(userId, {
      name: 'Car Upgrade Downpayment',
      targetAmount: 250000,
      currentAmount: 95000,
      category: 'Major Purchase',
      targetDate: `${today.getFullYear() + 1}-12-31`,
      color: '#3B82F6'
    });

    return { success: true, count: sampleTxs.length };
  }

  // Export User Data
  async exportUserData(userId) {
    const user = await this.findUserById(userId);
    const transactions = await this.getTransactions(userId);
    const budgets = await this.getBudgets(userId);
    const goals = await this.getGoals(userId);

    return {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      user: {
        id: userId,
        name: user?.name || 'User',
        email: user?.email || '',
        currency: user?.currency || '₹'
      },
      transactions,
      budgets,
      goals
    };
  }

  // Import User Data
  async importUserData(userId, importedData) {
    if (!importedData || !Array.isArray(importedData.transactions)) {
      throw new Error('Invalid backup file. Must contain a transactions array.');
    }

    for (const tx of importedData.transactions) {
      await this.addTransaction(userId, {
        type: tx.type,
        amount: tx.amount,
        category: tx.category,
        date: tx.date,
        paymentMethod: tx.paymentMethod,
        note: tx.note
      });
    }

    if (Array.isArray(importedData.budgets)) {
      for (const b of importedData.budgets) {
        if (b.category && b.limit) {
          await this.updateBudget(userId, b.category, b.limit);
        }
      }
    }

    if (Array.isArray(importedData.goals)) {
      for (const g of importedData.goals) {
        await this.addGoal(userId, g);
      }
    }

    return { success: true, importedTransactions: importedData.transactions.length };
  }
}

module.exports = new UnifiedDatabaseService();
