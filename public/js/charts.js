// FlowExpense - Chart.js Visualization Engine

const categoryColors = {
  'EMIs & Loans': '#E11D48',
  'Food & Dining': '#F59E0B',
  'Shopping': '#EC4899',
  'Housing': '#6366F1',
  'Transportation': '#0EA5E9',
  'Bills & Utilities': '#14B8A6',
  'Entertainment': '#8B5CF6',
  'Health & Fitness': '#10B981',
  'Travel': '#F97316',
  'Salary': '#22C55E',
  'Freelance': '#06B6D4',
  'SIP (Mutual Funds)': '#0284C7',
  'Recurring Deposit (RD)': '#06B6D4',
  'Fixed Deposit (FD)': '#14B8A6',
  'Stocks & Shares': '#6366F1',
  'PPF / EPF / NPS': '#8B5CF6',
  'Gold & SGB': '#D97706',
  'Crypto': '#EA580C',
  'Other Investment': '#64748B',
  'Other': '#64748B'
};

function getCategoryColor(category) {
  return categoryColors[category] || '#8B5CF6';
}

const chartsManager = {
  categoryChart: null,
  cashFlowChart: null,

  isDarkTheme() {
    return document.documentElement.getAttribute('data-theme') !== 'light';
  },

  getThemeColors() {
    const isDark = this.isDarkTheme();
    return {
      text: isDark ? '#94A3B8' : '#475569',
      grid: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
      tooltipBg: isDark ? '#1E293B' : '#FFFFFF',
      tooltipText: isDark ? '#F8FAFC' : '#0F172A',
      tooltipBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
    };
  },

  initCategoryChart(categories, currency = '₹') {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    if (this.categoryChart) {
      this.categoryChart.destroy();
    }

    const theme = this.getThemeColors();
    const labels = categories.length > 0 ? categories.map(c => c.category) : ['No Expenses'];
    const data = categories.length > 0 ? categories.map(c => c.amount) : [1];
    const bgColors = categories.length > 0 
      ? categories.map(c => getCategoryColor(c.category))
      : ['#334155'];

    this.categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: bgColors,
          borderWidth: 2,
          borderColor: this.isDarkTheme() ? '#111827' : '#FFFFFF',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            display: false // Using custom accessible HTML legend list below chart
          },
          tooltip: {
            backgroundColor: theme.tooltipBg,
            titleColor: theme.tooltipText,
            bodyColor: theme.tooltipText,
            borderColor: theme.tooltipBorder,
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            usePointStyle: true,
            callbacks: {
              label: (context) => {
                if (categories.length === 0) return ' No expense data logged';
                const val = context.raw || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                return ` ${context.label}: ${currency}${val.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${pct}%)`;
              }
            }
          }
        },
        animation: {
          animateScale: true,
          animateRotate: true,
          duration: 800
        }
      }
    });
  },

  initCashFlowChart(monthlyData, currency = '₹') {
    const ctx = document.getElementById('cashFlowChart');
    if (!ctx) return;

    if (this.cashFlowChart) {
      this.cashFlowChart.destroy();
    }

    const theme = this.getThemeColors();
    const labels = monthlyData.map(m => m.month);
    const incomeData = monthlyData.map(m => m.income);
    const expenseData = monthlyData.map(m => m.expense);
    const investmentData = monthlyData.map(m => m.investment || 0);

    this.cashFlowChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Income',
            data: incomeData,
            backgroundColor: '#10B981',
            borderRadius: 6,
            maxBarThickness: 20
          },
          {
            label: 'Expense',
            data: expenseData,
            backgroundColor: '#F43F5E',
            borderRadius: 6,
            maxBarThickness: 20
          },
          {
            label: 'Investment',
            data: investmentData,
            backgroundColor: '#0EA5E9',
            borderRadius: 6,
            maxBarThickness: 20
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false // Pill legend styled in HTML
          },
          tooltip: {
            backgroundColor: theme.tooltipBg,
            titleColor: theme.tooltipText,
            bodyColor: theme.tooltipText,
            borderColor: theme.tooltipBorder,
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            usePointStyle: true,
            callbacks: {
              label: (context) => {
                const val = context.raw || 0;
                return ` ${context.dataset.label}: ${currency}${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: theme.text,
              font: {
                family: 'Plus Jakarta Sans',
                size: 11,
                weight: '600'
              }
            }
          },
          y: {
            grid: {
              color: theme.grid,
              drawBorder: false
            },
            ticks: {
              color: theme.text,
              font: {
                family: 'Plus Jakarta Sans',
                size: 11
              },
              callback: (val) => `${currency}${val >= 1000 ? (val / 1000) + 'k' : val}`
            }
          }
        },
        animation: {
          duration: 800
        }
      }
    });
  },

  updateCharts(stats, currency = '₹') {
    if (stats.categoryBreakdown) {
      this.initCategoryChart(stats.categoryBreakdown, currency);
    }
    if (stats.monthlyCashFlow) {
      this.initCashFlowChart(stats.monthlyCashFlow, currency);
    }
  }
};
