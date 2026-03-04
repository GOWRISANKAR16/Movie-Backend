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
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
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
    return res.status(500).json({ message: 'Internal server error' });
  }
};

