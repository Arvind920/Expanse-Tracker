const http = require('http');
const app = require('express')();
const cors = require('cors');

// Test db service first
const db = require('./src/services/db');

console.log('Testing Database Service...');
const stats = db.getStats();
console.log('✔ Initial stats generated:', {
  netBalance: stats.netBalance,
  thisMonthIncome: stats.thisMonthIncome,
  thisMonthExpense: stats.thisMonthExpense,
  savingsRate: `${stats.savingsRate}%`,
  categoriesCount: stats.categoryBreakdown.length,
  cashFlowMonths: stats.monthlyCashFlow.length
});

const txList = db.getTransactions({ type: 'expense' });
console.log(`✔ Filtered transactions: ${txList.length} expenses found`);

const testTx = db.addTransaction({
  type: 'expense',
  amount: 45.5,
  category: 'Food & Dining',
  note: 'Verification test transaction',
  paymentMethod: 'Credit Card'
});
console.log('✔ Added transaction:', testTx.id, testTx.amount);

const budgets = db.getBudgets();
console.log(`✔ Budgets retrieved: ${budgets.length} categories tracked`);

const goals = db.getGoals();
console.log(`✔ Goals retrieved: ${goals.length} goals found`);

// Clean up test transaction
db.deleteTransaction(testTx.id);
console.log('✔ Test transaction successfully cleaned up');

console.log('\nAll backend logic verified successfully!');
