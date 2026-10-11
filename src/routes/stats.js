const express = require('express');
const router = express.Router();
const db = require('../services/db');
const { authMiddleware } = require('../middleware/auth');

// GET /api/stats (Protected)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const stats = await db.getStats(req.user.id);
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
