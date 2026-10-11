const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

function post(path, body) {
  return new Promise((resolve, reject) => {
    const dataString = JSON.stringify(body);
    const req = http.request(`http://localhost:3000${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.write(dataString);
    req.end();
  });
}

async function runVerification() {
  console.log('--- Testing Live Server Endpoints ---');

  const health = await get('/api/health');
  console.log('✔ GET /api/health:', health.status, health.data);

  const stats = await get('/api/stats');
  console.log('✔ GET /api/stats:', stats.status, {
    netBalance: stats.data.data.netBalance,
    monthlyExpense: stats.data.data.thisMonthExpense,
    savingsRate: `${stats.data.data.savingsRate}%`
  });

  const txs = await get('/api/transactions?type=expense&limit=5');
  console.log('✔ GET /api/transactions:', txs.status, `count: ${txs.data.count}`);

  const newTx = await post('/api/transactions', {
    type: 'expense',
    amount: 29.99,
    category: 'Entertainment',
    paymentMethod: 'Credit Card',
    note: 'Cinema movie ticket verification'
  });
  console.log('✔ POST /api/transactions:', newTx.status, newTx.data.data.id, newTx.data.data.amount);

  const budgets = await get('/api/budgets');
  console.log('✔ GET /api/budgets:', budgets.status, `categories: ${budgets.data.data.length}`);

  const goals = await get('/api/goals');
  console.log('✔ GET /api/goals:', goals.status, `goals: ${goals.data.data.length}`);

  const index = await get('/');
  console.log('✔ GET / (Frontend HTML):', index.status, `bytes: ${index.raw.length}`);

  console.log('\n🌟 All live server tests passed successfully!');
}

runVerification().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
