// controllers/auth.controller.js
const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const { queryOne, query } = require("../config/db");
const R = require("../utils/response");

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await queryOne(
      "SELECT id, name, email, role, password_hash, is_active FROM users WHERE email = $1",
      [email]
    );
    if (!user) return R.unauthorized(res, "Invalid email or password");
    if (!user.is_active) return R.unauthorized(res, "Account is deactivated. Contact admin.");

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return R.unauthorized(res, "Invalid email or password");

    // Update last_login
    await query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);

    const token = signToken(user.id);
    const { password_hash: _, ...safeUser } = user;

    return R.success(res, { token, user: safeUser }, "Login successful");
  } catch (err) { next(err); }
}

// GET /api/auth/me
async function getMe(req, res) {
  const { password_hash: _, ...safeUser } = req.user;
  return R.success(res, { user: req.user });
}

// PATCH /api/auth/change-password
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await queryOne(
      "SELECT password_hash FROM users WHERE id = $1",
      [req.user.id]
    );
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return R.badRequest(res, "Current password is incorrect");

    const hash = await bcrypt.hash(newPassword, 10);
    await query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, req.user.id]);

    return R.success(res, {}, "Password changed successfully");
  } catch (err) { next(err); }
}

module.exports = { login, getMe, changePassword };
