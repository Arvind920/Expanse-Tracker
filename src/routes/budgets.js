const express = require('express');
const router = express.Router();
const db = require('../services/db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/budgets
router.get('/', async (req, res) => {
  try {
    const budgets = await db.getBudgets(req.user.id);
    res.json({ success: true, data: budgets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/budgets
router.post('/', async (req, res) => {
  try {
    const { category, limit } = req.body;
    if (!category || limit === undefined || isNaN(Number(limit))) {
      return res.status(400).json({ success: false, error: 'Category and valid limit are required' });
    }
    const updated = await db.updateBudget(req.user.id, category, parseFloat(limit));
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/budgets/:category
router.delete('/:category', async (req, res) => {
  try {
    const deleted = await db.deleteBudget(req.user.id, req.params.category);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Budget category not found' });
    }
    res.json({ success: true, message: 'Budget category deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
