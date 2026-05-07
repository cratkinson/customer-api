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

router.delete('/me', authenticate, (req, res) => {
  const db = getDb();
  const result = db
    .prepare('DELETE FROM customers WHERE customerId = ?')
    .run(req.customer.sub);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  res.status(204).send();
});

module.exports = router;
