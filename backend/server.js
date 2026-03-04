const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const config = require('./config/config');
const authRoutes = require('./routes/authRoutes');
const { testConnection } = require('./db');

const app = express();

app.use(
  cors({
    origin: true, // reflect request origin
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.get('/health', async (req, res) => {
  try {
    await testConnection();
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

app.use('/api/auth', authRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

