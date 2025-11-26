const pool = require('../db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Simple in-memory admin sessions map: token -> { id, username, createdAt }
const adminSessions = {};

async function ensureTables() {
  // Create required tables if they don't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      fullname TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS officials (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      position TEXT NOT NULL,
      contact_info TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Insert a default admin if none exist (username: admin, password: admin)
  const r = await pool.query('SELECT count(*) AS c FROM admins');
  const count = parseInt(r.rows[0].c, 10);
  if (count === 0) {
    const hashed = await bcrypt.hash('admin', 10);
    await pool.query('INSERT INTO admins(username, password) VALUES($1, $2)', ['admin', hashed]);
    console.log('Inserted default admin user: admin / admin');
  }
}

ensureTables().catch(err => {
  console.error('Error ensuring tables', err);
});

function requireAdminToken(req) {
  const auth = req.headers.authorization || req.headers.Authorization || '';
  if (!auth) return null;
  const parts = auth.split(' ');
  if (parts.length !== 2) return null;
  const token = parts[1];
  return adminSessions[token] || null;
}

module.exports = {
  adminLogin: async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) return res.status(400).json({ error: 'username and password are required' });
      const result = await pool.query('SELECT * FROM admins WHERE username=$1', [username]);
      if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid credentials' });
      const admin = result.rows[0];
      const match = await bcrypt.compare(password, admin.password);
      if (!match) return res.status(400).json({ error: 'Invalid credentials' });
      const token = crypto.randomBytes(24).toString('hex');
      adminSessions[token] = { id: admin.id, username: admin.username, createdAt: Date.now() };
      return res.json({ message: 'Login success', admin: { id: admin.id, username: admin.username }, token });
    } catch (err) {
      console.error('adminLogin error', err);
      res.status(500).json({ error: err.message });
    }
  },

  getAllUsers: async (req, res) => {
    try {
      const sess = requireAdminToken(req);
      if (!sess) return res.status(401).json({ error: 'Unauthorized' });
      const result = await pool.query('SELECT id, fullname, email, created_at FROM users ORDER BY id DESC');
      return res.json(result.rows || []);
    } catch (err) {
      console.error('getAllUsers error', err);
      res.status(500).json({ error: err.message });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const sess = requireAdminToken(req);
      if (!sess) return res.status(401).json({ error: 'Unauthorized' });
      const id = parseInt(req.params.id, 10);
      if (!id) return res.status(400).json({ error: 'Invalid id' });
      await pool.query('DELETE FROM users WHERE id=$1', [id]);
      return res.json({ message: 'User deleted' });
    } catch (err) {
      console.error('deleteUser error', err);
      res.status(500).json({ error: err.message });
    }
  },

  getOfficials: async (req, res) => {
    try {
      const result = await pool.query('SELECT id, name, position, contact_info, created_at FROM officials ORDER BY id DESC');
      return res.json(result.rows || []);
    } catch (err) {
      console.error('getOfficials error', err);
      res.status(500).json({ error: err.message });
    }
  },

  addOfficial: async (req, res) => {
    try {
      const sess = requireAdminToken(req);
      if (!sess) return res.status(401).json({ error: 'Unauthorized' });
      const { name, position, contact_info } = req.body;
      if (!name || !position) return res.status(400).json({ error: 'name and position are required' });
      const result = await pool.query('INSERT INTO officials(name, position, contact_info, created_at) VALUES($1,$2,$3,NOW()) RETURNING id, name, position, contact_info, created_at', [name, position, contact_info || null]);
      return res.json(result.rows[0]);
    } catch (err) {
      console.error('addOfficial error', err);
      res.status(500).json({ error: err.message });
    }
  },

  deleteOfficial: async (req, res) => {
    try {
      const sess = requireAdminToken(req);
      if (!sess) return res.status(401).json({ error: 'Unauthorized' });
      const id = parseInt(req.params.id, 10);
      if (!id) return res.status(400).json({ error: 'Invalid id' });
      await pool.query('DELETE FROM officials WHERE id=$1', [id]);
      return res.json({ message: 'Official deleted' });
    } catch (err) {
      console.error('deleteOfficial error', err);
      res.status(500).json({ error: err.message });
    }
  }
};
