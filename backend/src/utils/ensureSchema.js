const pool = require('../config/db');

const ensureSchema = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(120),
      email VARCHAR(255) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'member',
      notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      dark_mode BOOLEAN NOT NULL DEFAULT FALSE,
      timezone VARCHAR(80) NOT NULL DEFAULT 'UTC',
      language VARCHAR(40) NOT NULL DEFAULT 'en',
      smtp_service VARCHAR(80),
      smtp_host VARCHAR(255),
      smtp_port INTEGER NOT NULL DEFAULT 587,
      smtp_secure BOOLEAN NOT NULL DEFAULT FALSE,
      smtp_user VARCHAR(255),
      smtp_pass TEXT,
      smtp_from VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS project_members (
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (project_id, user_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'todo',
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'member';`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(120);`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS dark_mode BOOLEAN NOT NULL DEFAULT FALSE;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(80) NOT NULL DEFAULT 'UTC';`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR(40) NOT NULL DEFAULT 'en';`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS smtp_service VARCHAR(80);`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS smtp_host VARCHAR(255);`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS smtp_port INTEGER NOT NULL DEFAULT 587;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS smtp_secure BOOLEAN NOT NULL DEFAULT FALSE;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS smtp_user VARCHAR(255);`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS smtp_pass TEXT;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS smtp_from VARCHAR(255);`);
  await pool.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE;`);
  await pool.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;`);
  await pool.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;`);
  await pool.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;`);
};

module.exports = ensureSchema;
