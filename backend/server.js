require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// serve static frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

app.get('/health', (req, res) => res.json({ ok: true, time: Date.now() }));

// Status endpoint: checks DB connectivity and basic table existence
app.get('/status', async (req, res) => {
  const status = { ok: true, db: false };
  try {
    // quick DB ping
    await pool.query('SELECT 1');
    status.db = true;
  } catch (err) {
    status.ok = false;
    status.error = err.message;
  }
  return res.json(status);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection', err);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception', err);
});