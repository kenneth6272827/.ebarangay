const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

let pool;
// If DATABASE_URL is present, enable SSL for hosted Postgres (common requirement)
if (process.env.DATABASE_URL) {
  const opts = { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } };
  pool = new Pool(opts);
} else {
  pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
  });
}

// Run simple migrations and ensure tables exist. Insert a default admin if none present.
(async () => {
  try {
    const client = await pool.connect();
    // users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        fullname TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW())
      )
    `);
    // admins table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW())
      )
    `);
    // officials table
    await client.query(`
      CREATE TABLE IF NOT EXISTS officials (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        position TEXT NOT NULL,
        contact_info TEXT
      )
    `);

    // ensure a default admin exists
    const r = await client.query('SELECT COUNT(*) AS c FROM admins');
    const count = r.rows && r.rows[0] ? Number(r.rows[0].c) : 0;
    if (count === 0) {
      const defaultPwd = process.env.DEFAULT_ADMIN_PWD || 'admin123';
      const hashed = await bcrypt.hash(defaultPwd, 10);
      await client.query('INSERT INTO admins(username, password, created_at) VALUES($1, $2, NOW())', ['admin', hashed]);
      console.log('Inserted default admin user `admin` (change DEFAULT_ADMIN_PWD in env)');
    }

    client.release();
  } catch (err) {
    // Do not crash the process here; log helpful message for deployment debugging
    console.error('Error during DB initialization/migrations:', err.message || err);
  }
})();

module.exports = pool;