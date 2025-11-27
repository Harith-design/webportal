// src/utils/auth.js
// CommonJS style - matches typical Node/Express setups.
// If your backend uses ES modules, convert to `export` syntax.

const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.ACCESS_SECRET || 'replace_this_secret_for_dev_only';
const ACCESS_TTL = process.env.ACCESS_TTL || '15m'; // adjust if you want longer/shorter

/**
 * signAccess(payload)
 *  - payload should be a plain object (e.g. { id, email, role })
 *  - returns a signed JWT string
 */
function signAccess(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('signAccess requires a payload object');
  }
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}

/**
 * verifyAccess(token)
 *  - returns decoded payload if valid
 *  - throws if token invalid/expired
 */
function verifyAccess(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('verifyAccess requires a token string');
  }
  return jwt.verify(token, ACCESS_SECRET);
}

module.exports = { signAccess, verifyAccess };
