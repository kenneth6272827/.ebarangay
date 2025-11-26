const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');

const dataDir = path.join(__dirname, '..', 'data');
const usersFile = path.join(dataDir, 'users.json');

async function ensureFile(filePath, initial = '[]') {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.access(filePath);
  } catch (e) {
    await fs.writeFile(filePath, initial, 'utf8');
  }
}

async function readJson(filePath) {
  await ensureFile(filePath);
  const txt = await fs.readFile(filePath, 'utf8');
  try { return JSON.parse(txt || '[]'); } catch (e) { return []; }
}

async function writeJson(filePath, obj) {
  await fs.writeFile(filePath, JSON.stringify(obj, null, 2), 'utf8');
}

module.exports = {
  // return array of users
  getAll: async function() {
    return await readJson(usersFile);
  },
  findByEmail: async function(email) {
    const users = await readJson(usersFile);
    return users.find(u => String(u.email).toLowerCase() === String(email).toLowerCase()) || null;
  },
  findById: async function(id) {
    const users = await readJson(usersFile);
    return users.find(u => Number(u.id) === Number(id)) || null;
  },
  createUser: async function({ fullname, email, password }) {
    const users = await readJson(usersFile);
    const exists = users.find(u => String(u.email).toLowerCase() === String(email).toLowerCase());
    if (exists) {
      const err = new Error('Email already registered');
      err.code = 'EMAIL_EXISTS';
      throw err;
    }
    const hashed = await bcrypt.hash(password, 10);
    const id = users.length ? (Math.max(...users.map(u => Number(u.id) || 0)) + 1) : 1;
    const created_at = new Date().toISOString();
    const user = { id, fullname, email, password: hashed, created_at };
    users.push(user);
    await writeJson(usersFile, users);
    return { id, fullname, email, created_at };
  },
  // helper to validate credentials
  validateCredentials: async function(email, password) {
    const user = await this.findByEmail(email);
    if (!user) return null;
    const match = await bcrypt.compare(password, user.password);
    if (!match) return null;
    const { password: pw, ...safe } = user;
    return safe;
  }
};
