// server.js  —  Entry point
require("dotenv").config();

// Validate required env vars before anything else
const REQUIRED = [
  "DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD",
  "JWT_SECRET",
  "WA_PHONE_NUMBER_ID", "WA_ACCESS_TOKEN", "WA_VERIFY_TOKEN",
];
const missing = REQUIRED.filter(k => !process.env[k]);
if (missing.length) {
  console.error("❌  Missing required environment variables:", missing.join(", "));
  console.error("    Copy .env.example to .env and fill in the values.");
  process.exit(1);
}

const app    = require("./app");
const logger = require("./utils/logger");
const { pool } = require("./config/db");   // triggers DB connection test

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`🚀  EduFollow CRM API running on port ${PORT}  [${process.env.NODE_ENV}]`);
  logger.info(`📋  API docs: http://localhost:${PORT}/api/health`);
});

// ── Start scheduled jobs ──────────────────────────────────────
require("./jobs/scheduler");

// ── Graceful shutdown ─────────────────────────────────────────
async function shutdown(signal) {
  logger.info(`[${signal}] Shutting down gracefully…`);
  server.close(async () => {
    await pool.end();
    logger.info("PostgreSQL pool closed. Bye!");
    process.exit(0);
  });
  // Force exit after 10 s if graceful close hangs
  setTimeout(() => process.exit(1), 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));

// Catch unhandled rejections so the process doesn't silently crash
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection:", reason);
});
process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception:", err);
  process.exit(1);
});
