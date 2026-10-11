// FlowExpense - Main Application Controller

// Category definitions with icons
const categoryDefinitions = {
  expense: [
    { name: 'EMIs & Loans', icon: 'fa-landmark', color: '#E11D48' },
    { name: 'Food & Dining', icon: 'fa-utensils', color: '#F59E0B' },
    { name: 'Shopping', icon: 'fa-bag-shopping', color: '#EC4899' },
    { name: 'Housing', icon: 'fa-house', color: '#6366F1' },
    { name: 'Transportation', icon: 'fa-car', color: '#0EA5E9' },
    { name: 'Bills & Utilities', icon: 'fa-bolt', color: '#14B8A6' },
    { name: 'Entertainment', icon: 'fa-film', color: '#8B5CF6' },
    { name: 'Health & Fitness', icon: 'fa-dumbbell', color: '#10B981' },
    { name: 'Travel', icon: 'fa-plane', color: '#F97316' },
    { name: 'Other', icon: 'fa-ellipsis', color: '#64748B' }
  ],
  investment: [
    { name: 'SIP (Mutual Funds)', icon: 'fa-chart-pie', color: '#0284C7' },
    { name: 'Recurring Deposit (RD)', icon: 'fa-repeat', color: '#06B6D4' },
    { name: 'Fixed Deposit (FD)', icon: 'fa-vault', color: '#14B8A6' },
    { name: 'Stocks & Shares', icon: 'fa-arrow-trend-up', color: '#6366F1' },
    { name: 'PPF / EPF / NPS', icon: 'fa-shield-halved', color: '#8B5CF6' },
    { name: 'Gold & SGB', icon: 'fa-coins', color: '#D97706' },
    { name: 'Crypto', icon: 'fa-bitcoin-sign', color: '#EA580C' },
    { name: 'Other Investment', icon: 'fa-briefcase', color: '#64748B' }
  ],
  income: [
    { name: 'Salary', icon: 'fa-money-bill-wave', color: '#22C55E' },
    { name: 'Freelance', icon: 'fa-laptop-code', color: '#06B6D4' },
    { name: 'Dividends / Returns', icon: 'fa-chart-line', color: '#3B82F6' },
    { name: 'Other Income', icon: 'fa-ellipsis', color: '#64748B' }
  ]
};

function getCategoryMeta(categoryName, type = 'expense') {
  const allPool = [
    ...categoryDefinitions.expense,
    ...categoryDefinitions.investment,
    ...categoryDefinitions.income
  ];
  const pool = categoryDefinitions[type] || allPool;
  const found = pool.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
  if (found) return found;
  const anyFound = allPool.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
  return anyFound || { name: categoryName, icon: 'fa-tag', color: '#8B5CF6' };
}

// Global App State
const state = {
  currency: localStorage.getItem('flowexpense_currency') || '₹',
  theme: localStorage.getItem('flowexpense_theme') || 'dark',
  filters: {
    type: 'all',
    category: 'all',
    search: '',
    sortBy: 'date',
    order: 'desc'
  },
  stats: null,
  transactions: [],
  budgets: [],
  goals: [],
  itemToDelete: null // { type: 'transaction' | 'goal', id: '...' }
};

// ==========================================================================
// Initialization
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
  applyTheme(state.theme);
  setupCurrencyDropdown();
  setupEventListeners();
  updateGreetingDate();
  await refreshAllData();
});

function updateGreetingDate() {
  const dateEl = document.getElementById('greeting-date');
  if (dateEl) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const todayStr = new Date().toLocaleDateString(undefined, options);
    dateEl.textContent = `Today is ${todayStr} • Track your cash flow`;
  }
}

function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('flowexpense_theme', theme);
  if (state.stats) {
    chartsManager.updateCharts(state.stats, state.currency);
  }
}

function setupCurrencyDropdown() {
  const select = document.getElementById('currency-select');
  if (select) {
    select.value = state.currency;
    updateCurrencySymbolDisplays();
  }
}

function updateCurrencySymbolDisplays() {
  const modalSymbol = document.getElementById('modal-currency-symbol');
  if (modalSymbol) modalSymbol.textContent = state.currency;
}

// ==========================================================================
// Data Fetching & State Refresh
// ==========================================================================

async function refreshAllData() {
  try {
    const [stats, transactions, budgets, goals] = await Promise.all([
      api.getStats(),
      api.getTransactions(state.filters),
      api.getBudgets(),
      api.getGoals()
    ]);

    state.stats = stats;
    state.transactions = transactions;
    state.budgets = budgets;
    state.goals = goals;

    renderKPIs();
    renderCharts();
    renderBudgets();
    renderGoals();
    renderTransactions();
  } catch (err) {
    console.error('Error refreshing data:', err);
    showToast('Failed to load financial records from server', 'error');
  }
}

// ==========================================================================
// Currency Formatter Utility
// ==========================================================================

function formatCurrency(amount, includeSign = false) {
  const num = Number(amount) || 0;
  const locale = state.currency === '₹' ? 'en-IN' : undefined;
  const formatted = Math.abs(num).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  if (includeSign) {
    const sign = num > 0 ? '+' : num < 0 ? '-' : '';
    return `${sign}${state.currency}${formatted}`;
  }
  return `${state.currency}${formatted}`;
}

// ==========================================================================
// UI Rendering Functions
// ==========================================================================

function renderKPIs() {
  const { stats } = state;
  if (!stats) return;

  const totalBalanceEl = document.getElementById('kpi-total-balance');
  const netWorthEl = document.getElementById('kpi-net-worth');
  const monthIncomeEl = document.getElementById('kpi-month-income');
  const monthExpenseEl = document.getElementById('kpi-month-expense');
  const monthInvestmentEl = document.getElementById('kpi-month-investment');
  const totalInvestmentAllEl = document.getElementById('kpi-total-investment-all');
  const savingsRateEl = document.getElementById('kpi-savings-rate');
  const netSavingsEl = document.getElementById('kpi-net-savings');
  const totalIncomeAllEl = document.getElementById('kpi-total-income-all');
  const totalExpenseAllEl = document.getElementById('kpi-total-expense-all');

  if (totalBalanceEl) {
    const sign = stats.netBalance >= 0 ? '' : '-';
    totalBalanceEl.textContent = `${sign}${formatCurrency(Math.abs(stats.netBalance))}`;
  }

  if (netWorthEl) {
    netWorthEl.textContent = formatCurrency(stats.totalNetWorth || (stats.netBalance + (stats.totalInvestmentAllTime || 0)));
  }

  if (monthIncomeEl) {
    monthIncomeEl.textContent = `+${formatCurrency(stats.thisMonthIncome)}`;
  }

  if (monthExpenseEl) {
    monthExpenseEl.textContent = `-${formatCurrency(stats.thisMonthExpense)}`;
  }

  if (monthInvestmentEl) {
    monthInvestmentEl.textContent = formatCurrency(stats.thisMonthInvestment || 0);
  }

  if (totalInvestmentAllEl) {
    totalInvestmentAllEl.textContent = `Total invested: ${formatCurrency(stats.totalInvestmentAllTime || 0)}`;
  }

  if (savingsRateEl) {
    savingsRateEl.textContent = `${stats.savingsRate}%`;
  }

  if (netSavingsEl) {
    netSavingsEl.textContent = `Net saved: ${formatCurrency(stats.thisMonthSavings, true)}`;
  }

  if (totalIncomeAllEl) {
    totalIncomeAllEl.textContent = `Total all time: ${formatCurrency(stats.totalIncomeAllTime)}`;
  }

  if (totalExpenseAllEl) {
    totalExpenseAllEl.textContent = `Total all time: ${formatCurrency(stats.totalExpenseAllTime)}`;
  }
}

function renderCharts() {
  const { stats } = state;
  if (!stats) return;

  // Update Category Badge count
  const badge = document.getElementById('chart-total-categories');
  if (badge) {
    badge.textContent = `${stats.categoryBreakdown ? stats.categoryBreakdown.length : 0} Categories`;
  }

  // Populate Custom HTML Legend below doughnut chart
  const legendContainer = document.getElementById('category-legend-list');
  if (legendContainer) {
    if (!stats.categoryBreakdown || stats.categoryBreakdown.length === 0) {
      legendContainer.innerHTML = '<p class="text-muted" style="font-size:0.8rem;text-align:center;padding:0.5rem;">No expense categories recorded for this month.</p>';
    } else {
      legendContainer.innerHTML = stats.categoryBreakdown.map(item => {
        const meta = getCategoryMeta(item.category, 'expense');
        return `
          <div class="custom-legend-item">
            <div class="legend-item-left">
              <span class="legend-color-dot" style="background-color: ${meta.color}"></span>
              <span class="legend-cat-name">${escapeHtml(item.category)}</span>
            </div>
            <div class="legend-item-right">
              <span class="legend-cat-amt">${formatCurrency(item.amount)}</span>
              <span class="legend-cat-pct">${item.percentage}%</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  chartsManager.updateCharts(stats, state.currency);
}

function renderBudgets() {
  const container = document.getElementById('budgets-list');
  if (!container) return;

  const { budgets } = state;
  if (!budgets || budgets.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 1.5rem;">
        <p class="text-muted" style="margin:0;">No budgets set yet. Click "Set Limits" to track category spending.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = budgets.map(b => {
    const meta = getCategoryMeta(b.category, 'expense');
    let statusClass = 'budget-status-safe';
    if (b.percentage >= 100) {
      statusClass = 'budget-status-danger';
    } else if (b.percentage >= 80) {
      statusClass = 'budget-status-warning';
    }

    const cappedPct = Math.min(100, b.percentage);

    return `
      <div class="budget-item">
        <div class="budget-item-header">
          <div class="budget-cat-title">
            <i class="fa-solid ${meta.icon}" style="color: ${meta.color}; width: 16px;"></i>
            <span>${escapeHtml(b.category)}</span>
          </div>
          <div class="budget-spent-info">
            <strong>${formatCurrency(b.spent)}</strong> of ${formatCurrency(b.limit)}
          </div>
        </div>
        <div class="budget-progress-track">
          <div class="budget-progress-fill ${statusClass}" style="width: ${cappedPct}%"></div>
        </div>
        <div class="budget-footer">
          <span>${b.percentage}% used</span>
          <span>${b.remaining > 0 ? `${formatCurrency(b.remaining)} left` : '<strong class="text-danger">Exceeded!</strong>'}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderGoals() {
  const container = document.getElementById('goals-list');
  if (!container) return;

  const { goals } = state;
  if (!goals || goals.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 1.5rem;">
        <p class="text-muted" style="margin:0;">No savings goals created yet. Click "New Goal" to get started.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = goals.map(g => {
    const pct = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
    const cappedPct = Math.min(100, pct);
    const dateFormatted = g.targetDate ? new Date(g.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Ongoing';

    return `
      <div class="goal-card-item">
        <div class="goal-item-top">
          <div class="goal-name-wrap">
            <h4>${escapeHtml(g.name)}</h4>
            <span class="goal-target-date">
              <i class="fa-regular fa-calendar"></i> Target: ${dateFormatted}
            </span>
          </div>
          <div class="goal-actions">
            <button class="btn-icon-xs" onclick="openEditGoalModal('${g.id}')" title="Edit Goal">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn-icon-xs delete" onclick="confirmDeleteGoal('${g.id}')" title="Delete Goal">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>

        <div class="goal-amounts-row">
          <span class="goal-current-amt">${formatCurrency(g.currentAmount)}</span>
          <span class="goal-target-amt">Target: ${formatCurrency(g.targetAmount)} (${pct}%)</span>
        </div>

        <div class="goal-progress-bar">
          <div class="goal-progress-fill" style="width: ${cappedPct}%; background-color: ${g.color || '#10B981'}"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderTransactions() {
  const tbody = document.getElementById('transactions-tbody');
  const emptyState = document.getElementById('tx-empty-state');
  const table = document.getElementById('transactions-table');
  const countLabel = document.getElementById('tx-count-label');

  if (!tbody || !emptyState) return;

  const { transactions } = state;

  if (countLabel) {
    countLabel.textContent = `Showing ${transactions.length} transaction${transactions.length === 1 ? '' : 's'}`;
  }

  if (transactions.length === 0) {
    tbody.innerHTML = '';
    table.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }

  table.classList.remove('hidden');
  emptyState.classList.add('hidden');

  tbody.innerHTML = transactions.map(tx => {
    const isIncome = tx.type === 'income';
    const isInvestment = tx.type === 'investment';
    const meta = getCategoryMeta(tx.category, tx.type);
    const dateFormatted = tx.date ? new Date(tx.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
    const sign = isIncome ? '+' : isInvestment ? '📈 ' : '-';
    const amountStr = `${sign}${formatCurrency(tx.amount)}`;
    const amountClass = isIncome ? 'income' : isInvestment ? 'investment' : 'expense';

    return `
      <tr>
        <td>
          <span class="tx-cat-badge" style="background: ${meta.color}20; color: ${meta.color}; border: 1px solid ${meta.color}40;">
            <i class="fa-solid ${meta.icon}"></i> ${escapeHtml(tx.category)}
          </span>
        </td>
        <td>
          <div class="tx-note-title">${escapeHtml(tx.note || 'Untitled Transaction')}</div>
        </td>
        <td class="tx-date-cell">${dateFormatted}</td>
        <td>
          <span class="tx-method-pill">
            <i class="fa-regular fa-credit-card"></i> ${escapeHtml(tx.paymentMethod || 'Other')}
          </span>
        </td>
        <td class="text-right">
          <span class="tx-amount ${amountClass}">${amountStr}</span>
        </td>
        <td class="text-center">
          <div class="tx-actions-cell">
            <button class="btn-icon-xs" onclick="openEditTxModal('${tx.id}')" title="Edit Transaction">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn-icon-xs delete" onclick="confirmDeleteTx('${tx.id}')" title="Delete Transaction">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ==========================================================================
// Event Listeners & Interactive Handlers
// ==========================================================================

function setupEventListeners() {
  // Theme Toggle
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', () => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
      showToast(`Switched to ${newTheme} theme`, 'info');
    });
  }

  // Currency Selector
  const currencySelect = document.getElementById('currency-select');
  if (currencySelect) {
    currencySelect.addEventListener('change', (e) => {
      state.currency = e.target.value;
      localStorage.setItem('flowexpense_currency', state.currency);
      updateCurrencySymbolDisplays();
      renderKPIs();
      renderCharts();
      renderBudgets();
      renderGoals();
      renderTransactions();
      showToast(`Currency updated to ${state.currency}`, 'info');
    });
  }

  // Quick Seed Button
  const btnQuickSeed = document.getElementById('btn-quick-seed');
  if (btnQuickSeed) {
    btnQuickSeed.addEventListener('click', handleLoadSeedData);
  }
  const btnFooterSeed = document.getElementById('btn-footer-seed');
  if (btnFooterSeed) {
    btnFooterSeed.addEventListener('click', handleLoadSeedData);
  }
  const btnModalSeed = document.getElementById('btn-modal-load-seed');
  if (btnModalSeed) {
    btnModalSeed.addEventListener('click', () => {
      closeModal('modal-data-tools');
      handleLoadSeedData();
    });
  }

  // Add Transaction Buttons
  const btnAddTx = document.getElementById('btn-add-transaction');
  if (btnAddTx) {
    btnAddTx.addEventListener('click', () => openAddTxModal());
  }
  const btnEmptyAddTx = document.getElementById('btn-empty-add-tx');
  if (btnEmptyAddTx) {
    btnEmptyAddTx.addEventListener('click', () => openAddTxModal());
  }

  // Transaction Modal Type Radios (Expense vs Income vs Investment changes categories)
  const radioExpense = document.getElementById('radio-type-expense');
  const radioIncome = document.getElementById('radio-type-income');
  const radioInvestment = document.getElementById('radio-type-investment');
  if (radioExpense && radioIncome) {
    radioExpense.addEventListener('change', () => populateCategoryOptions('expense'));
    radioIncome.addEventListener('change', () => populateCategoryOptions('income'));
    if (radioInvestment) {
      radioInvestment.addEventListener('change', () => populateCategoryOptions('investment'));
    }
  }

  // Transaction Form Submit
  const formTx = document.getElementById('form-transaction');
  if (formTx) {
    formTx.addEventListener('submit', handleTransactionSubmit);
  }

  // Filter Tabs (All / Expense / Income)
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      state.filters.type = e.target.getAttribute('data-type');
      await applyFilters();
    });
  });

  // Search Input with Debounce
  const searchInput = document.getElementById('tx-search-input');
  const btnClearSearch = document.getElementById('btn-clear-search');
  let searchTimeout = null;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      if (btnClearSearch) {
        if (val.length > 0) btnClearSearch.classList.remove('hidden');
        else btnClearSearch.classList.add('hidden');
      }

      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(async () => {
        state.filters.search = val;
        await applyFilters();
      }, 300);
    });
  }

  if (btnClearSearch) {
    btnClearSearch.addEventListener('click', async () => {
      searchInput.value = '';
      btnClearSearch.classList.add('hidden');
      state.filters.search = '';
      await applyFilters();
    });
  }

  // Category Filter Dropdown
  const catFilter = document.getElementById('tx-category-filter');
  if (catFilter) {
    catFilter.addEventListener('change', async (e) => {
      state.filters.category = e.target.value;
      await applyFilters();
    });
  }

  // Sort Filter Dropdown
  const sortSelect = document.getElementById('tx-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', async (e) => {
      const [sortBy, order] = e.target.value.split('-');
      state.filters.sortBy = sortBy;
      state.filters.order = order;
      await applyFilters();
    });
  }

  // Budget Modal Openers
  const btnManageBudgets = document.getElementById('btn-manage-budgets');
  const btnQuickEditBudgets = document.getElementById('btn-quick-edit-budgets');
  if (btnManageBudgets) btnManageBudgets.addEventListener('click', openBudgetModal);
  if (btnQuickEditBudgets) btnQuickEditBudgets.addEventListener('click', openBudgetModal);

  // Budget Form Submit
  const formBudgets = document.getElementById('form-budgets');
  if (formBudgets) {
    formBudgets.addEventListener('submit', handleBudgetSubmit);
  }

  // Goal Modal Openers
  const btnAddGoal = document.getElementById('btn-add-goal');
  if (btnAddGoal) btnAddGoal.addEventListener('click', () => openAddGoalModal());

  // Goal Form Submit
  const formGoal = document.getElementById('form-goal');
  if (formGoal) {
    formGoal.addEventListener('submit', handleGoalSubmit);
  }

  // Data Tools Modal Openers
  const btnDataTools = document.getElementById('btn-open-data-tools');
  const btnFooterBackup = document.getElementById('btn-footer-backup');
  if (btnDataTools) btnDataTools.addEventListener('click', () => openModal('modal-data-tools'));
  if (btnFooterBackup) btnFooterBackup.addEventListener('click', () => openModal('modal-data-tools'));

  // Data Import Handling
  const backupInput = document.getElementById('backup-file-input');
  const btnUploadBackup = document.getElementById('btn-upload-backup');
  if (backupInput && btnUploadBackup) {
    backupInput.addEventListener('change', (e) => {
      btnUploadBackup.disabled = !e.target.files.length;
    });

    btnUploadBackup.addEventListener('click', handleBackupRestore);
  }

  // Modal Closers
  setupModalCloseButtons();

  // Confirm Delete Button
  const btnConfirmDel = document.getElementById('btn-confirm-del');
  if (btnConfirmDel) {
    btnConfirmDel.addEventListener('click', executeDeleteItem);
  }
}

async function applyFilters() {
  try {
    state.transactions = await api.getTransactions(state.filters);
    renderTransactions();
  } catch (err) {
    showToast('Failed to apply filters', 'error');
  }
}

// ==========================================================================
// Modal Helpers
// ==========================================================================

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function setupModalCloseButtons() {
  const modals = [
    { modalId: 'modal-transaction', closeBtns: ['btn-close-tx-modal', 'btn-cancel-tx-modal'] },
    { modalId: 'modal-budgets', closeBtns: ['btn-close-budget-modal', 'btn-cancel-budget-modal'] },
    { modalId: 'modal-goal', closeBtns: ['btn-close-goal-modal', 'btn-cancel-goal-modal'] },
    { modalId: 'modal-data-tools', closeBtns: ['btn-close-data-modal', 'btn-close-data-modal-foot'] },
    { modalId: 'modal-confirm-delete', closeBtns: ['btn-close-del-modal', 'btn-cancel-del'] }
  ];

  modals.forEach(({ modalId, closeBtns }) => {
    closeBtns.forEach(btnId => {
      const btn = document.getElementById(btnId);
      if (btn) btn.addEventListener('click', () => closeModal(modalId));
    });

    const modal = document.getElementById(modalId);
    if (modal) {
      const backdrop = modal.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.addEventListener('click', () => closeModal(modalId));
      }
    }
  });

  // ESC key listener to close top active modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const activeModal = document.querySelector('.modal.active');
      if (activeModal) closeModal(activeModal.id);
    }
  });
}

// ==========================================================================
// Transaction Management Handlers
// ==========================================================================

function populateCategoryOptions(type = 'expense', selectedCategory = '') {
  const select = document.getElementById('tx-category-input');
  if (!select) return;

  const categories = categoryDefinitions[type] || categoryDefinitions.expense;
  select.innerHTML = categories.map(c => `
    <option value="${c.name}" ${c.name === selectedCategory ? 'selected' : ''}>
      ${c.name}
    </option>
  `).join('');
}

function openAddTxModal() {
  const title = document.getElementById('modal-tx-title');
  const form = document.getElementById('form-transaction');
  const idInput = document.getElementById('tx-id-input');
  const amountInput = document.getElementById('tx-amount-input');
  const dateInput = document.getElementById('tx-date-input');
  const noteInput = document.getElementById('tx-note-input');
  const methodInput = document.getElementById('tx-payment-method');
  const radioExpense = document.getElementById('radio-type-expense');

  if (title) title.textContent = 'Add Transaction';
  if (form) form.reset();
  if (idInput) idInput.value = '';
  if (radioExpense) radioExpense.checked = true;

  populateCategoryOptions('expense');

  // Default to today
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  updateCurrencySymbolDisplays();
  openModal('modal-transaction');
  if (amountInput) amountInput.focus();
}

function openEditTxModal(txId) {
  const tx = state.transactions.find(t => t.id === txId);
  if (!tx) return;

  const title = document.getElementById('modal-tx-title');
  const idInput = document.getElementById('tx-id-input');
  const amountInput = document.getElementById('tx-amount-input');
  const dateInput = document.getElementById('tx-date-input');
  const noteInput = document.getElementById('tx-note-input');
  const methodInput = document.getElementById('tx-payment-method');
  const radioExpense = document.getElementById('radio-type-expense');
  const radioIncome = document.getElementById('radio-type-income');
  const radioInvestment = document.getElementById('radio-type-investment');

  if (title) title.textContent = 'Edit Transaction';
  if (idInput) idInput.value = tx.id;
  if (amountInput) amountInput.value = tx.amount;
  if (dateInput) dateInput.value = tx.date;
  if (noteInput) noteInput.value = tx.note || '';
  if (methodInput) methodInput.value = tx.paymentMethod || 'Credit Card';

  if (tx.type === 'income') {
    if (radioIncome) radioIncome.checked = true;
    populateCategoryOptions('income', tx.category);
  } else if (tx.type === 'investment') {
    if (radioInvestment) radioInvestment.checked = true;
    populateCategoryOptions('investment', tx.category);
  } else {
    if (radioExpense) radioExpense.checked = true;
    populateCategoryOptions('expense', tx.category);
  }

  updateCurrencySymbolDisplays();
  openModal('modal-transaction');
}

async function handleTransactionSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('tx-id-input').value;
  const type = document.querySelector('input[name="tx-type"]:checked').value;
  const amount = parseFloat(document.getElementById('tx-amount-input').value);
  const category = document.getElementById('tx-category-input').value;
  const date = document.getElementById('tx-date-input').value;
  const paymentMethod = document.getElementById('tx-payment-method').value;
  const note = document.getElementById('tx-note-input').value.trim();

  if (!amount || amount <= 0) {
    showToast('Please enter a valid amount', 'error');
    return;
  }

  const payload = { type, amount, category, date, paymentMethod, note };

  try {
    if (id) {
      await api.updateTransaction(id, payload);
      showToast('Transaction updated successfully', 'success');
    } else {
      await api.addTransaction(payload);
      showToast('New transaction logged', 'success');
    }

    closeModal('modal-transaction');
    await refreshAllData();
  } catch (err) {
    showToast(`Failed to save: ${err.message}`, 'error');
  }
}

function confirmDeleteTx(txId) {
  state.itemToDelete = { type: 'transaction', id: txId };
  const msg = document.getElementById('confirm-del-message');
  if (msg) msg.textContent = 'Are you sure you want to permanently delete this transaction?';
  openModal('modal-confirm-delete');
}

// ==========================================================================
// Budgets Modal Handlers
// ==========================================================================

function openBudgetModal() {
  const container = document.getElementById('budget-inputs-container');
  if (!container) return;

  const currentBudgets = {};
  state.budgets.forEach(b => {
    currentBudgets[b.category] = b.limit;
  });

  const categories = categoryDefinitions.expense;
  container.innerHTML = categories.map(c => {
    const currentLimit = currentBudgets[c.name] !== undefined ? currentBudgets[c.name] : 0;
    return `
      <div class="budget-input-item">
        <label for="budget-cat-${c.name}">
          <i class="fa-solid ${c.icon}" style="color:${c.color}; width: 16px;"></i> ${escapeHtml(c.name)}
        </label>
        <div class="input-prefix-wrapper">
          <span class="currency-symbol-addon">${state.currency}</span>
          <input type="number" id="budget-cat-${c.name}" data-category="${c.name}" min="0" step="10" value="${currentLimit}" class="form-input">
        </div>
      </div>
    `;
  }).join('');

  openModal('modal-budgets');
}

async function handleBudgetSubmit(e) {
  e.preventDefault();
  const inputs = document.querySelectorAll('#budget-inputs-container input');
  
  try {
    for (const input of inputs) {
      const category = input.getAttribute('data-category');
      const limit = parseFloat(input.value) || 0;
      await api.updateBudget(category, limit);
    }

    showToast('Category budgets updated successfully', 'success');
    closeModal('modal-budgets');
    await refreshAllData();
  } catch (err) {
    showToast(`Failed to save budgets: ${err.message}`, 'error');
  }
}

// ==========================================================================
// Goals Handlers
// ==========================================================================

function openAddGoalModal() {
  const form = document.getElementById('form-goal');
  const title = document.getElementById('modal-goal-title');
  const idInput = document.getElementById('goal-id-input');

  if (title) title.textContent = 'Add Savings Goal';
  if (form) form.reset();
  if (idInput) idInput.value = '';

  openModal('modal-goal');
}

function openEditGoalModal(goalId) {
  const goal = state.goals.find(g => g.id === goalId);
  if (!goal) return;

  const title = document.getElementById('modal-goal-title');
  const idInput = document.getElementById('goal-id-input');
  const nameInput = document.getElementById('goal-name-input');
  const targetInput = document.getElementById('goal-target-input');
  const currentInput = document.getElementById('goal-current-input');
  const dateInput = document.getElementById('goal-date-input');
  const colorInput = document.getElementById('goal-color-input');

  if (title) title.textContent = 'Edit Savings Goal';
  if (idInput) idInput.value = goal.id;
  if (nameInput) nameInput.value = goal.name;
  if (targetInput) targetInput.value = goal.targetAmount;
  if (currentInput) currentInput.value = goal.currentAmount;
  if (dateInput) dateInput.value = goal.targetDate || '';
  if (colorInput) colorInput.value = goal.color || '#10B981';

  openModal('modal-goal');
}

async function handleGoalSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('goal-id-input').value;
  const name = document.getElementById('goal-name-input').value.trim();
  const targetAmount = parseFloat(document.getElementById('goal-target-input').value);
  const currentAmount = parseFloat(document.getElementById('goal-current-input').value) || 0;
  const targetDate = document.getElementById('goal-date-input').value;
  const color = document.getElementById('goal-color-input').value;

  if (!name || isNaN(targetAmount) || targetAmount <= 0) {
    showToast('Please provide a goal name and valid target amount', 'error');
    return;
  }

  const payload = { name, targetAmount, currentAmount, targetDate, color };

  try {
    if (id) {
      await api.updateGoal(id, payload);
      showToast('Savings goal updated', 'success');
    } else {
      await api.addGoal(payload);
      showToast('Savings goal created', 'success');
    }

    closeModal('modal-goal');
    await refreshAllData();
  } catch (err) {
    showToast(`Failed to save goal: ${err.message}`, 'error');
  }
}

function confirmDeleteGoal(goalId) {
  state.itemToDelete = { type: 'goal', id: goalId };
  const msg = document.getElementById('confirm-del-message');
  if (msg) msg.textContent = 'Are you sure you want to permanently delete this savings goal?';
  openModal('modal-confirm-delete');
}

// ==========================================================================
// Delete & Data Tools Handlers
// ==========================================================================

async function executeDeleteItem() {
  if (!state.itemToDelete) return;

  const { type, id } = state.itemToDelete;
  try {
    if (type === 'transaction') {
      await api.deleteTransaction(id);
      showToast('Transaction deleted', 'success');
    } else if (type === 'goal') {
      await api.deleteGoal(id);
      showToast('Savings goal deleted', 'success');
    }

    closeModal('modal-confirm-delete');
    state.itemToDelete = null;
    await refreshAllData();
  } catch (err) {
    showToast(`Error deleting item: ${err.message}`, 'error');
  }
}

async function handleLoadSeedData() {
  try {
    await api.seedDemoData();
    showToast('Rich demo financial dataset loaded!', 'success');
    await refreshAllData();
  } catch (err) {
    showToast(`Failed to load demo data: ${err.message}`, 'error');
  }
}

async function handleBackupRestore() {
  const fileInput = document.getElementById('backup-file-input');
  if (!fileInput || !fileInput.files.length) return;

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = async (e) => {
    try {
      const json = JSON.parse(e.target.result);
      await api.importBackup(json);
      showToast('Backup restored successfully!', 'success');
      closeModal('modal-data-tools');
      await refreshAllData();
    } catch (err) {
      showToast(`Invalid JSON backup file: ${err.message}`, 'error');
    }
  };

  reader.readAsText(file);
}

// ==========================================================================
// Toast Notification Center
// ==========================================================================

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconClass = type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-circle-xmark' : 'fa-circle-info';

  toast.innerHTML = `
    <i class="fa-solid ${iconClass} toast-icon"></i>
    <span class="toast-message">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  // Trigger smooth enter animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Auto dismiss
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3500);
}

// Utility: HTML Escaper for XSS prevention
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
