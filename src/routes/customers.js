'use strict';

const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getDb } = require('../db');

const router = express.Router();

router.get('/me', authenticate, (req, res) => {
  const db = getDb();
  const customer = db
    .prepare('SELECT customerId, name, email, created_at FROM customers WHERE customerId = ?')
    .get(req.customer.sub);

  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  res.json(customer);
});

module.exports = router;
