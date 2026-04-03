const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'taskmanager',
  password: 'postgres123',
  port: 5434,
});

module.exports = pool;