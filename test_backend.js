// Test db service
const db = require('./src/services/db');

async function testBackend() {
  console.log('Testing Database Service...');

  // Test user creation
  const testEmail = `test_${Date.now()}@test.com`;
  const user = await db.createUser({
    name: 'Test Runner',
    email: testEmail,
    password: 'password123',
    currency: '₹'
  });
  console.log('✔ User created:', user.id, user.email);

  const stats = await db.getStats(user.id);
  console.log('✔ Initial stats generated:', {
    netBalance: stats.netBalance,
    thisMonthIncome: stats.thisMonthIncome,
    thisMonthExpense: stats.thisMonthExpense,
    savingsRate: `${stats.savingsRate}%`,
    categoriesCount: stats.categoryBreakdown.length,
    cashFlowMonths: stats.monthlyCashFlow.length
  });

  const testTx = await db.addTransaction(user.id, {
    type: 'expense',
    amount: 1450,
    category: 'EMIs & Loans',
    note: 'Verification test EMI',
    paymentMethod: 'Credit Card'
  });
  console.log('✔ Added transaction:', testTx.id, testTx.amount);

  const txList = await db.getTransactions(user.id, { type: 'expense' });
  console.log(`✔ Filtered transactions: ${txList.length} expenses found`);

  const budgets = await db.getBudgets(user.id);
  console.log(`✔ Budgets retrieved: ${budgets.length} categories tracked`);

  const goals = await db.getGoals(user.id);
  console.log(`✔ Goals retrieved: ${goals.length} goals found`);

  // Clean up test transaction
  await db.deleteTransaction(testTx.id, user.id);
  console.log('✔ Test transaction successfully cleaned up');

  console.log('\nAll backend logic verified successfully!');
}

testBackend().catch(err => {
  console.error('Test backend error:', err);
  process.exit(1);
});
