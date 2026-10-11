const express = require('express');
const router = express.Router();
const db = require('../services/db');
const { authMiddleware } = require('../middleware/auth');

// Protect all transactions endpoints with authentication
router.use(authMiddleware);

// GET /api/transactions
// Query params: type, category, search, startDate, endDate, sortBy, order
router.get('/', async (req, res) => {
  try {
    const transactions = await db.getTransactions(req.user.id, req.query);
    res.json({ success: true, count: transactions.length, data: transactions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/transactions/:id
router.get('/:id', async (req, res) => {
  try {
    const tx = await db.getTransactionById(req.params.id, req.user.id);
    if (!tx) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }
    res.json({ success: true, data: tx });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/transactions
router.post('/', async (req, res) => {
  try {
    const { type, amount, category, date, paymentMethod, note } = req.body;
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid amount greater than 0 is required' });
    }

    if (!category || category.trim() === '') {
      return res.status(400).json({ success: false, error: 'Category is required' });
    }

    const validTypes = ['income', 'expense', 'investment'];
    const resolvedType = validTypes.includes(type) ? type : 'expense';

    const newTx = await db.addTransaction(req.user.id, {
      type: resolvedType,
      amount: parseFloat(amount),
      category: category.trim(),
      date: date || new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethod || 'Cash',
      note: note || ''
    });

    res.status(201).json({ success: true, data: newTx });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/transactions/:id
router.put('/:id', async (req, res) => {
  try {
    const updated = await db.updateTransaction(req.params.id, req.user.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await db.deleteTransaction(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }
    res.json({ success: true, message: 'Transaction successfully deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
