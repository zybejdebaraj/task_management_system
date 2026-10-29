const { database } = require('./env');
const { Pool } = require('pg');

const pool = new Pool(database);

module.exports = pool;
