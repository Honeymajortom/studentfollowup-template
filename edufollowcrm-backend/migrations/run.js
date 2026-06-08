// migrations/run.js
// Run: node migrations/run.js
// Executes schema.sql against your PostgreSQL database

require("dotenv").config();
const { Pool } = require("pg");
const fs       = require("fs");
const path     = require("path");

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl:      process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

async function run() {
  const client = await pool.connect();
  try {
    console.log("🔗  Connected to PostgreSQL →", process.env.DB_NAME);

    const schemaPath = path.join(__dirname, "schema.sql");
    const sql        = fs.readFileSync(schemaPath, "utf8");

    console.log("⚙️   Running schema.sql …");
    await client.query(sql);

    console.log("✅  Migration complete!");
    console.log("");
    console.log("Default admin credentials:");
    console.log("  Email:    admin@eduspark.in");
    console.log("  Password: Admin@123");
    console.log("  ⚠️  Change this password immediately after first login!");
  } catch (err) {
    console.error("❌  Migration failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
