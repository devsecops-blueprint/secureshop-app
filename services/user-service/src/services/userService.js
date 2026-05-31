'use strict';

const argon2 = require('argon2');
const jwt    = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');
const config   = require('../config');
const logger   = require('../logger');

// Argon2id configuration — OWASP recommended minimums for 2024.
// memoryCost: 64MB, timeCost: 3 iterations, parallelism: 4 threads.
// This makes brute-force attacks computationally expensive.
const ARGON2_OPTIONS = {
  type:        argon2.argon2id,
  memoryCost:  65536,  // 64 MB
  timeCost:    3,
  parallelism: 4,
};

async function register({ name, email, password }) {
  // Check if email already exists
  const existing = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );
  if (existing.rows.length > 0) {
    throw { code: 'ALREADY_EXISTS', message: 'Email already registered' };
  }

  // Hash password with Argon2id before storing
  const hashedPassword = await argon2.hash(password, ARGON2_OPTIONS);

  const result = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, 'customer')
     RETURNING id, name, email, role`,
    [name, email, hashedPassword]
  );

  const user = result.rows[0];
  const token = signToken(user);

  logger.info('User registered', { userId: user.id, email: user.email });
  return { token, user };
}

async function login({ email, password }) {
  const result = await pool.query(
    'SELECT id, name, email, password, role FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    // Return same error as wrong password — prevents user enumeration attacks.
    // An attacker cannot tell whether the email exists or the password is wrong.
    throw { code: 'UNAUTHENTICATED', message: 'Invalid credentials' };
  }

  const user = result.rows[0];
  const valid = await argon2.verify(user.password, password);

  if (!valid) {
    throw { code: 'UNAUTHENTICATED', message: 'Invalid credentials' };
  }

  const token = signToken(user);

  logger.info('User logged in', { userId: user.id });
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
}

async function getUser({ userId }) {
  const result = await pool.query(
    'SELECT id, name, email, role FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw { code: 'NOT_FOUND', message: 'User not found' };
  }

  return result.rows[0];
}

function validateToken({ token }) {
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    return { valid: true, userId: decoded.sub, role: decoded.role };
  } catch (err) {
    return { valid: false, userId: '', role: '' };
  }
}

// signToken creates a JWT with the user ID as subject.
// The gateway's Auth middleware verifies these tokens on every request.
function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiry }
  );
}

module.exports = { register, login, getUser, validateToken };
