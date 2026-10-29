const path = require('node:path');

const envPath = path.resolve(__dirname, '../../.env');
require('dotenv').config({ path: envPath, quiet: true });

const required = ['JWT_SECRET'];
if (!process.env.DATABASE_URL) {
  required.push('DB_USER', 'DB_NAME', 'DB_PASSWORD');
}
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(
    `Missing backend environment settings: ${missing.join(', ')}. Set them in ${envPath}. See .env.example for the available settings.`
  );
}

function readPort(name, fallback) {
  const port = Number(process.env[name] || fallback);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${name} must be an integer between 1 and 65535.`);
  }
  return port;
}

module.exports = {
  port: readPort('PORT', 5000),
  database: process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: readPort('DB_PORT', 5432),
      },
};
