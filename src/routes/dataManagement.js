const express = require('express');
const router = express.Router();
const db = require('../services/db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// POST /api/seed - reset data to rich demo set for authenticated user
router.post('/seed', async (req, res) => {
  try {
    const result = await db.seedUserData(req.user.id);
    res.json({ success: true, message: 'Demo data loaded successfully for your account', count: result.count });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/export?format=csv|json
router.get('/export', async (req, res) => {
  try {
    const format = req.query.format || 'json';
    const rawData = await db.exportUserData(req.user.id);

    if (format === 'csv') {
      const headers = ['ID', 'Type', 'Amount', 'Category', 'Date', 'PaymentMethod', 'Note'];
      const rows = rawData.transactions.map(t => [
        `"${t.id}"`,
        `"${t.type}"`,
        t.amount,
        `"${t.category || ''}"`,
        `"${t.date || ''}"`,
        `"${t.paymentMethod || ''}"`,
        `"${(t.note || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=transactions-export.csv');
      return res.send(csvContent);
    }

    // Default JSON export
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=expense-tracker-backup.json');
    return res.json(rawData);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/import - restore from uploaded JSON backup for authenticated user
router.post('/import', async (req, res) => {
  try {
    const importedData = req.body;
    if (!importedData || !Array.isArray(importedData.transactions)) {
      return res.status(400).json({ success: false, error: 'Invalid backup format. Must contain a transactions array.' });
    }

    const result = await db.importUserData(req.user.id, importedData);
    res.json({ success: true, message: 'Data successfully imported to your account', count: result.importedTransactions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await db.getSettings(req.user.id);
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/settings
router.post('/settings', async (req, res) => {
  try {
    const updated = await db.updateUserSettings(req.user.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
