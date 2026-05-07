'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config');

function authenticate(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = header.slice(7);
  try {
    req.customer = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = { authenticate };
