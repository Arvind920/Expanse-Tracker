const express = require('express');
const router = express.Router();
const db = require('../services/db');

// GET /api/transactions
// Query params: type, category, search, startDate, endDate, sortBy, order
router.get('/', (req, res) => {
  try {
    const transactions = db.getTransactions(req.query);
    res.json({ success: true, count: transactions.length, data: transactions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/transactions/:id
router.get('/:id', (req, res) => {
  try {
    const tx = db.getTransactionById(req.params.id);
    if (!tx) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }
    res.json({ success: true, data: tx });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/transactions
router.post('/', (req, res) => {
  try {
    const { type, amount, category, date, paymentMethod, note } = req.body;
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid amount greater than 0 is required' });
    }

    if (!category || category.trim() === '') {
      return res.status(400).json({ success: false, error: 'Category is required' });
    }

    const newTx = db.addTransaction({
      type: type === 'income' ? 'income' : 'expense',
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
router.put('/:id', (req, res) => {
  try {
    const updated = db.updateTransaction(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', (req, res) => {
  try {
    const deleted = db.deleteTransaction(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }
    res.json({ success: true, message: 'Transaction successfully deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
