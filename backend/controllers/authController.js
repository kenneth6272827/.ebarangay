const pool = require("../db");
const bcrypt = require("bcrypt");

module.exports = {
	signup: async (req, res) => {
		try {
			const { fullname, email, password } = req.body;
			if (!fullname || !email || !password) return res.status(400).json({ error: 'fullname, email and password are required' });
			const hashed = await bcrypt.hash(password, 10);

			const result = await pool.query(
				"INSERT INTO users(fullname, email, password, created_at) VALUES($1, $2, $3, NOW()) RETURNING id, fullname, email, created_at",
				[fullname, email, hashed]
			);
			const created = result.rows && result.rows[0] ? result.rows[0] : null;
			return res.json({ message: "User registered successfully", user: created });
		} catch (err) {
			console.error('signup error', err);
			if (err.code === '23505') { // unique_violation
				return res.status(400).json({ error: 'Email already registered' });
			}
			res.status(500).json({ error: err.message });
		}
	},

	login: async (req, res) => {
		try {
			const { email, password } = req.body;
			if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

			const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
			if (result.rows.length === 0) return res.status(400).json({ error: "Invalid credentials" });
			const user = result.rows[0];
			const isMatch = await bcrypt.compare(password, user.password);
			if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });
			const { password: pw, ...safe } = user;
			return res.json({ message: "Login success", user: safe });
		} catch (err) {
			console.error('login error', err);
			res.status(500).json({ error: err.message });
		}
	},

	getProfile: async (req, res) => {
		try {
			const { id } = req.body;
			if (!id) return res.status(400).json({ error: 'id is required' });
			const result = await pool.query("SELECT id, fullname, email, created_at FROM users WHERE id=$1", [id]);
			if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
			return res.json(result.rows[0]);
		} catch (err) {
			console.error('getProfile error', err);
			res.status(500).json({ error: err.message });
		}
	},
};