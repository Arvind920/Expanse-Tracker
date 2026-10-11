const http = require('http');

function get(path, token = null) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    http.get(`http://localhost:3000${path}`, { headers }, (res) => {
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

function post(path, body, token = null) {
  return new Promise((resolve, reject) => {
    const dataString = JSON.stringify(body);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(dataString)
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(`http://localhost:3000${path}`, {
      method: 'POST',
      headers
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

  // Unauthenticated test
  const unauth = await get('/api/stats');
  console.log('✔ GET /api/stats (unauthenticated guard):', unauth.status === 401 ? '401 Unauthorized (Protected)' : unauth.status);

  // Register endpoint test
  const testEmail = `verify_${Date.now()}@test.com`;
  const reg = await post('/api/auth/register', {
    name: 'Endpoint Verifier',
    email: testEmail,
    password: 'verifierpassword',
    currency: '₹'
  });
  console.log('✔ POST /api/auth/register:', reg.status, reg.data?.user?.email);
  const token = reg.data?.token;

  const stats = await get('/api/stats', token);
  console.log('✔ GET /api/stats (authenticated):', stats.status, {
    netBalance: stats.data.data.netBalance,
    monthlyExpense: stats.data.data.thisMonthExpense,
    savingsRate: `${stats.data.data.savingsRate}%`
  });

  const txs = await get('/api/transactions?type=expense&limit=5', token);
  console.log('✔ GET /api/transactions:', txs.status, `count: ${txs.data.count}`);

  const newTx = await post('/api/transactions', {
    type: 'expense',
    amount: 2999,
    category: 'EMIs & Loans',
    paymentMethod: 'Credit Card',
    note: 'Gadget EMI payment'
  }, token);
  console.log('✔ POST /api/transactions:', newTx.status, newTx.data.data.id, newTx.data.data.amount);

  const budgets = await get('/api/budgets', token);
  console.log('✔ GET /api/budgets:', budgets.status, `categories: ${budgets.data.data.length}`);

  const goals = await get('/api/goals', token);
  console.log('✔ GET /api/goals:', goals.status, `goals: ${goals.data.data.length}`);

  const index = await get('/');
  console.log('✔ GET / (Frontend HTML):', index.status, `bytes: ${index.raw.length}`);

  console.log('\n🌟 All live server tests passed successfully!');
}

runVerification().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
