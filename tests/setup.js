'use strict';

// Set env vars before any module loads so dotenv doesn't override them
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-for-jest-only-do-not-use-in-production';
process.env.JWT_EXPIRES_IN = '15m';
process.env.PORT = '3001';
process.env.DB_PATH = ':memory:';
