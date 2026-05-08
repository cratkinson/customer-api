'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const { getDb } = require('../db');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts — try again in a minute' },
  skip: () => process.env.NODE_ENV === 'test',
});

function isValidPin(value) {
  return Number.isInteger(value) && value >= 0 && value <= 999999;
}

function isValidCustomerId(value) {
  return Number.isInteger(value) && value > 0;
}

router.post('/login', loginLimiter, async (req, res) => {
  const { customerId, pin } = req.body;

  if (!isValidCustomerId(customerId) || !isValidPin(pin)) {
    return res.status(400).json({ error: 'customerId and pin must be integers' });
  }

  const db = getDb();
  const customer = db.prepare('SELECT * FROM customers WHERE customerId = ?').get(customerId);

  // Constant-time comparison even on miss — prevents timing-based enumeration
  const hash = customer ? customer.pin_hash : '$2b$12$invalidhashpaddingtomatchbcryptlen000000000000000000000';
  const match = await bcrypt.compare(String(pin), hash);

  if (!customer || !match) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ sub: customer.customerId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

  res.json({ token });
});

module.exports = router;
