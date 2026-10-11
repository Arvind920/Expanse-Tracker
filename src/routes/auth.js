const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../services/db');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id || user._id?.toString(),
      email: user.email,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, currency, theme } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, error: 'Full name is required' });
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'A valid email address is required' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
    }

    const existing = await db.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists' });
    }

    const user = await db.createUser({
      name: name.trim(),
      email: email.trim(),
      password,
      currency: currency || '₹',
      theme: theme || 'dark'
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        theme: user.theme
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, error: 'Registration failed: ' + err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const userId = user.id || user._id?.toString();
    const token = generateToken({ id: userId, email: user.email, name: user.name });

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        currency: user.currency || '₹',
        theme: user.theme || 'dark'
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Login failed: ' + err.message });
  }
});

// GET /api/auth/me (Protected)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await db.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id || user._id?.toString(),
        name: user.name,
        email: user.email,
        currency: user.currency || '₹',
        theme: user.theme || 'dark'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/preferences (Protected)
router.post('/preferences', authMiddleware, async (req, res) => {
  try {
    const { currency, theme } = req.body;
    const updated = await db.updateUserSettings(req.user.id, { currency, theme });
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
