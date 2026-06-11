// Run: node migrations/run_leads.js
// Adds the leads table to an existing EduFollow CRM database

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

    const sql = fs.readFileSync(
      path.join(__dirname, "add_leads_table.sql"),
      "utf8"
    );

    console.log("⚙️   Running add_leads_table.sql …");
    await client.query(sql);

    console.log("✅  Leads migration complete!");
    console.log("    Table: leads");
    console.log("    Indexes: idx_leads_mobile, idx_leads_status, idx_leads_assigned, idx_leads_name");
    console.log("    Triggers: trg_lead_code (auto LEAD0001), trg_leads_updated_at");
  } catch (err) {
    console.error("❌  Migration failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
