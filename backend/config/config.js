const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(__dirname, '..', '.env'),
});

const {
  NODE_ENV = 'development',
  PORT = 5000,
  CLIENT_ORIGIN = 'http://localhost:3000',
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  JWT_SECRET,
} = process.env;

if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
  console.warn('Database environment variables are not fully configured.');
}

if (!JWT_SECRET) {
  console.warn('JWT_SECRET is not set. Authentication will not be secure.');
}

// Strip spaces/newlines so env pasted with line breaks still works (e.g. on Render)
const normalizedJwtSecret = typeof JWT_SECRET === 'string' ? JWT_SECRET.replace(/\s+/g, '') : JWT_SECRET;

module.exports = {
  env: NODE_ENV,
  port: Number(PORT) || 5000,
  clientOrigin: CLIENT_ORIGIN,
  db: {
    host: DB_HOST,
    port: Number(DB_PORT) || 3306,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  },
  jwt: {
    secret: normalizedJwtSecret,
    expiresIn: '1h',
  },
  cookie: {
    name: 'auth_token',
    httpOnly: true,
    sameSite: 'strict',
    secure: NODE_ENV === 'production',
    maxAge: 60 * 60 * 1000,
  },
};

