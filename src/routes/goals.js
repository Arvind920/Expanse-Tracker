const express = require('express');
const router = express.Router();
const db = require('../services/db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/goals
router.get('/', async (req, res) => {
  try {
    const goals = await db.getGoals(req.user.id);
    res.json({ success: true, data: goals });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/goals
router.post('/', async (req, res) => {
  try {
    const { name, targetAmount, currentAmount, category, targetDate, color } = req.body;
    if (!name || !targetAmount || isNaN(Number(targetAmount))) {
      return res.status(400).json({ success: false, error: 'Goal name and target amount are required' });
    }
    const newGoal = await db.addGoal(req.user.id, { name, targetAmount, currentAmount, category, targetDate, color });
    res.status(201).json({ success: true, data: newGoal });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/goals/:id
router.put('/:id', async (req, res) => {
  try {
    const updated = await db.updateGoal(req.params.id, req.user.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Goal not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/goals/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await db.deleteGoal(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Goal not found' });
    }
    res.json({ success: true, message: 'Goal deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
