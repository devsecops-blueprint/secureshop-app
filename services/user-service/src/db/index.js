'use strict';

const { Pool } = require('pg');
const config   = require('../config');
const logger   = require('../logger');

// Pool maintains a set of reusable connections to PostgreSQL.
// Creating a new connection for every query is expensive — the pool
// keeps connections alive and hands them out as needed.
const pool = new Pool({
  connectionString: config.databaseUrl,
  max:              10,   // maximum connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  logger.error('Unexpected PostgreSQL pool error', { error: err.message });
});

// migrate() creates the users table if it doesn't exist.
// In production this would be Flyway or Liquibase — for dev, inline SQL is fine.
async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      name       VARCHAR(255) NOT NULL,
      email      VARCHAR(255) NOT NULL UNIQUE,
      password   TEXT         NOT NULL,
      role       VARCHAR(50)  NOT NULL DEFAULT 'customer',
      created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);
  logger.info('Database migration complete');
}

module.exports = { pool, migrate };
