'use strict';

const express = require('express');
const helmet = require('helmet');
const authRouter = require('./src/routes/auth');
const customersRouter = require('./src/routes/customers');

const app = express();

app.use(helmet());
app.use(express.json());

app.use('/auth', authRouter);
app.use('/customers', customersRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler — never leak stack traces
app.use((err, req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
