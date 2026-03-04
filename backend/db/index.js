const mysql = require('mysql2');
const { db } = require('../config/config');

const pool = mysql.createPool({
  host: db.host,
  port: db.port,
  user: db.user,
  password: db.password,
  database: db.database,
  ssl: {
    rejectUnauthorized: true,
  },
});

const promisePool = pool.promise();

async function query(sql, params = []) {
  const [rows] = await promisePool.query(sql, params);
  return rows;
}

async function findUserByUsername(username) {
  const rows = await query('SELECT * FROM users WHERE uname = ?', [username]);
  return rows[0] || null;
}

async function findUserByEmail(email) {
  const rows = await query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function createUser({ username, email, phone, passwordHash, role }) {
  const result = await query(
    'INSERT INTO users (uname, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
    [username, email, phone, passwordHash, role],
  );
  return result.insertId;
}

async function testConnection() {
  await query('SELECT 1');
}

module.exports = {
  pool: promisePool,
  query,
  findUserByUsername,
  findUserByEmail,
  createUser,
  testConnection,
};

