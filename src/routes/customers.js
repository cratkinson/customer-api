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

router.put('/me', authenticate, (req, res) => {
  const { name, email } = req.body;

  const updates = {};
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'name must be a non-empty string' });
    }
    updates.name = name.trim();
  }
  if (email !== undefined) {
    if (typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({ error: 'email must be a non-empty string' });
    }
    updates.email = email.trim();
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Provide at least one field to update: name, email' });
  }

  const db = getDb();
  const fields = Object.keys(updates).map(k => `${k} = @${k}`).join(', ');
  const result = db
    .prepare(`UPDATE customers SET ${fields} WHERE customerId = @customerId`)
    .run({ ...updates, customerId: req.customer.sub });

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  const customer = db
    .prepare('SELECT customerId, name, email, created_at FROM customers WHERE customerId = ?')
    .get(req.customer.sub);

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
