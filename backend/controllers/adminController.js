const pool = require("../db");
const bcrypt = require("bcrypt");
const fs = require('fs').promises;
const path = require('path');
const usersFileUtils = require('../data/usersFile');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const dataDir = path.join(__dirname, '..', 'data');
const adminsFile = path.join(dataDir, 'admins.json');
const officialsFile = path.join(dataDir, 'officials.json');
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

// Force file-based storage for users (do not use Postgres/pgAdmin)
const usingDb = false;

const JWT_SECRET = process.env.JWT_SECRET || (() => {
	const s = crypto.randomBytes(32).toString('hex');
	return s;
})();

function getTokenFromReq(req) {
	const auth = req.headers.authorization || req.headers.Authorization || '';
	if (auth && auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
	if (req.body && req.body.token) return req.body.token;
	if (req.query && req.query.token) return req.query.token;
	return null;
}

function requireAdmin(req, res) {
	const token = getTokenFromReq(req);
	if (!token) {
		res.status(401).json({ error: 'Unauthorized' });
		return null;
	}
	try {
		const payload = jwt.verify(token, JWT_SECRET);
		// payload should contain { id, username }
		return payload;
	} catch (err) {
		res.status(401).json({ error: 'Unauthorized', details: err.message });
		return null;
	}
}

module.exports = {
	adminLogin: async (req, res) => {
		try {
			const { username, password } = req.body;
			if (!username || !password) return res.status(400).json({ error: 'username and password required' });
			if (usingDb) {
				const result = await pool.query('SELECT * FROM admins WHERE username=$1', [username]);
				if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid admin username' });
				const admin = result.rows[0];
				const match = await bcrypt.compare(password || '', admin.password);
				if (!match) return res.status(400).json({ error: 'Incorrect admin password' });
				const token = jwt.sign({ id: admin.id, username: admin.username, role: 'admin' }, JWT_SECRET, { expiresIn: '12h' });
				return res.json({ message: 'Admin login success', admin: { id: admin.id, username: admin.username }, token });
			} else {
				// file fallback
				await ensureFile(adminsFile);
				const admins = await readJson(adminsFile);
				const admin = admins.find(a => a.username === username);
				if (!admin) return res.status(400).json({ error: 'Invalid admin username' });
				const match = await bcrypt.compare(password || '', admin.password);
				if (!match) return res.status(400).json({ error: 'Incorrect admin password' });
				const token = jwt.sign({ id: admin.id, username: admin.username, role: 'admin' }, JWT_SECRET, { expiresIn: '12h' });
				return res.json({ message: 'Admin login success', admin: { id: admin.id, username: admin.username }, token });
			}
		} catch (err) {
			console.error('Admin login error', err);
			res.status(500).json({ error: err.message });
		}
	},

	getAllUsers: async (req, res) => {
		try {
			// require admin token
			if (!requireAdmin(req, res)) return;
			// file-based users
			const users = await usersFileUtils.getAll();
			return res.json(users.map(u => ({ id: u.id, fullname: u.fullname || u.name, email: u.email, created_at: u.created_at })));
		} catch (err) {
			console.error('getAllUsers error', err);
			res.status(500).json({ error: err.message });
		}
	},

	// Officials endpoints
	getOfficials: async (req, res) => {
		try {
			if (usingDb) {
				const r = await pool.query('SELECT id, name, position, contact_info FROM officials ORDER BY id ASC');
				return res.json(r.rows);
			}
			// file fallback
			const list = await readJson(officialsFile);
			return res.json(list || []);
		} catch (err) {
			console.error('getOfficials error', err);
			res.status(500).json({ error: err.message });
		}
	},

	addOfficial: async (req, res) => {
		try {
			// require admin
			if (!requireAdmin(req, res)) return;
			const { name, position, contact_info } = req.body;
			if (!name || !position) return res.status(400).json({ error: 'Name and position are required' });
			if (usingDb) {
				const r = await pool.query('INSERT INTO officials(name, position, contact_info) VALUES($1,$2,$3) RETURNING id, name, position, contact_info', [name, position, contact_info || '']);
				return res.json(r.rows[0]);
			}
			const list = await readJson(officialsFile);
			const id = list.length ? (Math.max(...list.map(o => o.id || 0)) + 1) : 1;
			const item = { id, name, position, contact_info: contact_info || '' };
			list.push(item);
			await writeJson(officialsFile, list);
			return res.json(item);
		} catch (err) {
			console.error('addOfficial error', err);
			res.status(500).json({ error: err.message });
		}
	},

	deleteOfficial: async (req, res) => {
		try {
			// require admin
			if (!requireAdmin(req, res)) return;
			const id = Number(req.params.id);
			if (!id) return res.status(400).json({ error: 'Invalid id' });
			if (usingDb) {
				const r = await pool.query('DELETE FROM officials WHERE id=$1 RETURNING id', [id]);
				if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' });
				return res.json({ success: true });
			}
			const list = await readJson(officialsFile);
			const idx = list.findIndex(o => Number(o.id) === id);
			if (idx === -1) return res.status(404).json({ error: 'Not found' });
			list.splice(idx, 1);
			await writeJson(officialsFile, list);
			return res.json({ success: true });
		} catch (err) {
			console.error('deleteOfficial error', err);
			res.status(500).json({ error: err.message });
		}
	}
};