'use strict';

const bcrypt = require('bcrypt');
const { getDb } = require('./index');

const SEED_CUSTOMERS = [
  { customerId: 1001, pin: '1234', name: 'Alice Nguyen',  email: 'alice@example.com' },
  { customerId: 1002, pin: '5678', name: 'Bob Martinez',  email: 'bob@example.com'   },
  { customerId: 1003, pin: '9999', name: 'Carol Smith',   email: 'carol@example.com' },
];

function seed() {
  const db = getDb();
  const insert = db.prepare(`
    INSERT OR IGNORE INTO customers (customerId, pin_hash, name, email)
    VALUES (@customerId, @pin_hash, @name, @email)
  `);

  const seedMany = db.transaction((customers) => {
    for (const c of customers) {
      insert.run({
        customerId: c.customerId,
        pin_hash: bcrypt.hashSync(c.pin, 12),
        name: c.name,
        email: c.email,
      });
    }
  });

  seedMany(SEED_CUSTOMERS);
}

module.exports = { seed };
