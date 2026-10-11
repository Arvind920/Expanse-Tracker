const express = require('express');
const router = express.Router();
const db = require('../services/db');

// GET /api/stats
router.get('/', (req, res) => {
  try {
    const stats = db.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
