const express = require('express');
const router = express.Router();
const db = require('../services/db');

// GET /api/goals
router.get('/', (req, res) => {
  try {
    const goals = db.getGoals();
    res.json({ success: true, data: goals });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/goals
router.post('/', (req, res) => {
  try {
    const { name, targetAmount, currentAmount, category, targetDate, color } = req.body;
    if (!name || !targetAmount || isNaN(Number(targetAmount))) {
      return res.status(400).json({ success: false, error: 'Goal name and target amount are required' });
    }
    const newGoal = db.addGoal({ name, targetAmount, currentAmount, category, targetDate, color });
    res.status(201).json({ success: true, data: newGoal });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/goals/:id
router.put('/:id', (req, res) => {
  try {
    const updated = db.updateGoal(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Goal not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/goals/:id
router.delete('/:id', (req, res) => {
  try {
    const deleted = db.deleteGoal(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Goal not found' });
    }
    res.json({ success: true, message: 'Goal deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
