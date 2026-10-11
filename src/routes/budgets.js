const express = require('express');
const router = express.Router();
const db = require('../services/db');

// GET /api/budgets
router.get('/', (req, res) => {
  try {
    const budgets = db.getBudgets();
    res.json({ success: true, data: budgets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/budgets
router.post('/', (req, res) => {
  try {
    const { category, limit } = req.body;
    if (!category || limit === undefined || isNaN(Number(limit))) {
      return res.status(400).json({ success: false, error: 'Category and valid limit are required' });
    }
    const updated = db.updateBudget(category, parseFloat(limit));
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/budgets/:category
router.delete('/:category', (req, res) => {
  try {
    const deleted = db.deleteBudget(req.params.category);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Budget category not found' });
    }
    res.json({ success: true, message: 'Budget category deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
