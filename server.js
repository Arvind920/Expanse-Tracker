require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { connectDB } = require('./src/config/db');

// Import routes
const authRouter = require('./src/routes/auth');
const transactionsRouter = require('./src/routes/transactions');
const statsRouter = require('./src/routes/stats');
const budgetsRouter = require('./src/routes/budgets');
const goalsRouter = require('./src/routes/goals');
const dataManagementRouter = require('./src/routes/dataManagement');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB Atlas (gracefully falls back to local JSON if not set)
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve frontend static assets
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount API routes
app.use('/api/auth', authRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/goals', goalsRouter);
app.use('/api', dataManagementRouter);

// Fallback to index.html for client-side navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Expense Tracker Server is running!`);
  console.log(`📍 Local URL: http://localhost:${PORT}`);
  console.log(`📡 API Health: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});
