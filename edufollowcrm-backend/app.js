// app.js
require("dotenv").config();

const express      = require("express");
const helmet       = require("helmet");
const cors         = require("cors");
const morgan       = require("morgan");
const path         = require("path");
const fs           = require("fs");

const routes       = require("./routes");
const errorHandler = require("./middleware/errorHandler");
const { apiLimiter } = require("./middleware/rateLimiter");
const logger       = require("./utils/logger");

const app = express();

// ── Security headers ──────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:3000",
];
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS policy: origin '${origin}' is not allowed`));
  },
  credentials: true,
  methods:     ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ── Body parsers ──────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── HTTP request logging ──────────────────────────────────────
// In production write to file; in dev, pretty-print to console
if (process.env.NODE_ENV === "production") {
  const logDir  = path.join(__dirname, "logs");
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
  const logStream = fs.createWriteStream(path.join(logDir, "access.log"), { flags: "a" });
  app.use(morgan("combined", { stream: logStream }));
} else {
  app.use(morgan("dev"));
}

// ── Global rate limit ─────────────────────────────────────────
app.use("/api", apiLimiter);

// ── Routes ────────────────────────────────────────────────────
app.use("/api", routes);

// ── 404 for unknown routes ────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    status:  "error",
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ── Global error handler (must be last) ───────────────────────
app.use(errorHandler);

module.exports = app;
