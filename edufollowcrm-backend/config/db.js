// config/db.js
const { Pool } = require("pg");

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl:      process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  // Pool tuning
  max:              10,   // max connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌  PostgreSQL connection failed:", err.message);
    process.exit(1);
  }
  release();
  console.log("✅  PostgreSQL connected →", process.env.DB_NAME);
});

// Helper: run a query
async function query(text, params) {
  const start = Date.now();
  const res   = await pool.query(text, params);
  const ms    = Date.now() - start;
  if (process.env.NODE_ENV === "development") {
    console.log(`[SQL] ${ms}ms →`, text.slice(0, 80).replace(/\s+/g, " "));
  }
  return res;
}

// Helper: get a single row
async function queryOne(text, params) {
  const res = await query(text, params);
  return res.rows[0] || null;
}

// Helper: get all rows
async function queryAll(text, params) {
  const res = await query(text, params);
  return res.rows;
}

// Helper: run multiple queries in a transaction
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, queryOne, queryAll, withTransaction };
