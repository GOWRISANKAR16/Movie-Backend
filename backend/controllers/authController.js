const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const config = require('../config/config');
const {
  findUserByUsername,
  findUserByEmail,
  createUser,
} = require('../db');

const SALT_ROUNDS = 10;

function validateRegisterInput({ username, email, phone, password }) {
  if (!username || !email || !phone || !password) {
    return 'All fields (username, email, phone, password) are required.';
  }

  if (!email.includes('@')) {
    return 'Email is not valid.';
  }

  if (password.length < 6) {
    return 'Password must be at least 6 characters long.';
  }

  return null;
}

exports.register = async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    const validationError = validateRegisterInput({
      username,
      email,
      phone,
      password,
    });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const existingByUsername = await findUserByUsername(username);
    if (existingByUsername) {
      return res.status(400).json({ message: 'Username already taken.' });
    }

    const existingByEmail = await findUserByEmail(email);
    if (existingByEmail) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const role = 'USER';

    await createUser({
      username,
      email,
      phone,
      passwordHash,
      role,
    });

    return res.status(201).json({ message: 'Register success' });
  } catch (error) {
    console.error('Error in /register:', error);
    const isDbError = error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || (error.code && String(error.code).startsWith('ER_'));
    const message = isDbError
      ? 'Database unavailable. Check Render env (DB_*) and that the users table exists.'
      : 'Internal server error';
    return res.status(isDbError ? 503 : 500).json({ message });
  }
};

exports.login = async (req, res) => {
  try {
    if (!config.jwt.secret) {
      console.error('JWT_SECRET is not set. Set it in .env (local) or Render Environment.');
      return res.status(500).json({
        message: 'Server error: authentication not configured. Please try again later.',
      });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.password) {
      console.error('User from DB has no password field:', user);
      return res.status(500).json({ message: 'Server error. Please try again later.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        sub: user.uname,
        role: user.role,
      },
      config.jwt.secret,
      {
        algorithm: 'HS256',
        expiresIn: config.jwt.expiresIn,
      },
    );

    res.cookie(config.cookie.name, token, {
      httpOnly: config.cookie.httpOnly,
      sameSite: config.cookie.sameSite,
      secure: config.cookie.secure,
      maxAge: config.cookie.maxAge,
    });

    return res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.error('Error in /login:', error);
    const isDbError = error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || (error.code && String(error.code).startsWith('ER_'));
    const isJwtError = error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError';
    const message = !config.jwt.secret
      ? 'Server error: authentication not configured.'
      : isJwtError
        ? 'Authentication error.'
        : isDbError
          ? 'Database unavailable. Check Render env (DB_*).'
          : 'Internal server error';
    return res.status(isDbError ? 503 : 500).json({ message });
  }
};

