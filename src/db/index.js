'use strict';

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const config = require('../config');

let db;

function initDb() {
  const dbPath = path.resolve(config.dbPath);
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      customerId INTEGER PRIMARY KEY,
      pin_hash   TEXT NOT NULL,
      name       TEXT NOT NULL,
      email      TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  return db;
}

function getDb() {
  if (!db) throw new Error('Database not initialised — call initDb() first');
  return db;
}

module.exports = { initDb, getDb };
