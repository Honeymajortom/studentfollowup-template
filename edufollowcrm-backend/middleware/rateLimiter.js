// middleware/rateLimiter.js
const rateLimit = require("express-rate-limit");

// Generic factory
const limiter = (max, windowMin, message) =>
  rateLimit({
    windowMs:        windowMin * 60 * 1000,
    max,
    message:         { status: "error", message },
    standardHeaders: true,
    legacyHeaders:   false,
  });

// Login — 10 attempts per 15 min
const authLimiter = limiter(10, 15, "Too many login attempts. Try again after 15 minutes.");

// WhatsApp sends — 60 per hour (avoid Meta rate limit violations)
const waLimiter = limiter(60, 60, "WhatsApp send limit reached. Please wait before sending more messages.");

// General API — 300 req per 5 min
const apiLimiter = limiter(300, 5, "Too many requests. Please slow down.");

module.exports = { authLimiter, waLimiter, apiLimiter };
