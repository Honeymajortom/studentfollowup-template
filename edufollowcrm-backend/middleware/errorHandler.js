// middleware/errorHandler.js
const logger = require("../utils/logger");

module.exports = function errorHandler(err, req, res, next) {
  logger.error({
    message: err.message,
    stack:   err.stack,
    path:    req.path,
    method:  req.method,
    body:    req.body,
    user:    req.user?.id,
  });

  // PostgreSQL specific errors
  if (err.code === "23505") {
    const field = err.detail?.match(/\((.+?)\)/)?.[1] || "field";
    return res.status(409).json({ status: "error", message: `${field} already exists` });
  }
  if (err.code === "23503") {
    return res.status(400).json({ status: "error", message: "Referenced record does not exist" });
  }
  if (err.code === "22P02") {
    return res.status(400).json({ status: "error", message: "Invalid UUID format" });
  }

  // Custom app errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({ status: "error", message: err.message });
  }

  // Default 500
  return res.status(500).json({
    status:  "error",
    message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
};

// Helper to create custom errors
function AppError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

module.exports.AppError = AppError;
