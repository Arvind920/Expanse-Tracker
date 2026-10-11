const express = require('express');
const router = express.Router();
const db = require('../services/db');

// POST /api/seed - reset data to rich demo set
router.post('/seed', (req, res) => {
  try {
    const data = db.resetToSeed();
    res.json({ success: true, message: 'Demo data loaded successfully', data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/export?format=csv|json
router.get('/export', (req, res) => {
  try {
    const format = req.query.format || 'json';
    const rawData = db.readRaw();

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

// POST /api/import - restore from uploaded JSON backup
router.post('/import', (req, res) => {
  try {
    const importedData = req.body;
    if (!importedData || !Array.isArray(importedData.transactions)) {
      return res.status(400).json({ success: false, error: 'Invalid backup format. Must contain a transactions array.' });
    }

    const current = db.readRaw();
    const updated = {
      ...current,
      transactions: importedData.transactions,
      budgets: importedData.budgets || current.budgets,
      goals: importedData.goals || current.goals,
      settings: importedData.settings || current.settings
    };

    db.writeRaw(updated);
    res.json({ success: true, message: 'Data successfully restored from backup' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/settings
router.get('/settings', (req, res) => {
  try {
    const settings = db.getSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/settings
router.post('/settings', (req, res) => {
  try {
    const updated = db.updateSettings(req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
