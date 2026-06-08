// routes/auth.routes.js
const router = require("express").Router();
const ctrl   = require("../controllers/auth.controller");
const { authenticate }    = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validate");
const { authLimiter }     = require("../middleware/rateLimiter");

// POST  /api/auth/login           — public
router.post("/login", authLimiter, validate(schemas.login), ctrl.login);

// GET   /api/auth/me              — protected
router.get("/me", authenticate, ctrl.getMe);

// PATCH /api/auth/change-password — protected
router.patch(
  "/change-password",
  authenticate,
  validate(schemas.changePassword),
  ctrl.changePassword
);

module.exports = router;
