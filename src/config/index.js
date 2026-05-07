'use strict';

require('dotenv').config();

const required = ['JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  port: parseInt(process.env.PORT, 10) || 3000,
  dbPath: process.env.DB_PATH || './data/customers.db',
};
