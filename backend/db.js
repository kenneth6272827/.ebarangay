const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Pool } = require('pg');

let pool;
if (process.env.DATABASE_URL) {
  const opts = { connectionString: process.env.DATABASE_URL };
  if (process.env.NODE_ENV === 'production') {
    opts.ssl = { rejectUnauthorized: false };
  }
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

module.exports = pool;