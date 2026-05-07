'use strict';

const config = require('./src/config');
const { initDb } = require('./src/db');
const { seed } = require('./src/db/seed');
const app = require('./app');

initDb();
seed();

app.listen(config.port, () => {
  console.log(`customer-api listening on port ${config.port}`);
});
