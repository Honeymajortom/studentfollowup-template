// routes/whatsapp.routes.js
const router = require("express").Router();
const ctrl   = require("../controllers/whatsapp.controller");
const { authenticate, authorize } = require("../middleware/auth");
const { validate, schemas }       = require("../middleware/validate");
const { waLimiter }               = require("../middleware/rateLimiter");

// ── Webhook (public — called by Meta) ────────────────────────
// GET  /api/whatsapp/webhook      — Meta verification handshake
router.get("/webhook", ctrl.webhookVerify);

// POST /api/whatsapp/webhook      — delivery status updates from Meta
router.post("/webhook", ctrl.webhookReceive);

// ── Protected routes ─────────────────────────────────────────
router.use(authenticate);

// POST /api/whatsapp/send         — send a WhatsApp message / schedule
router.post(
  "/send",
  authorize("admin", "counselor"),
  waLimiter,
  validate(schemas.sendWA),
  ctrl.send
);

// GET  /api/whatsapp/templates    — list all active templates
router.get("/templates", ctrl.listTemplates);

// GET  /api/whatsapp/logs         — message log with filters
router.get("/logs", ctrl.getLogs);

// GET  /api/whatsapp/stats        — sent/delivered/failed counts
router.get("/stats", ctrl.stats);

// POST /api/whatsapp/templates    — create template (admin only)
router.post("/templates", authorize("admin"), validate(schemas.createTemplate), ctrl.createTemplate);

// PATCH /api/whatsapp/templates/:id — update template (admin only)
router.patch("/templates/:id", authorize("admin"), validate(schemas.updateTemplate), ctrl.updateTemplate);

// DELETE /api/whatsapp/templates/:id — deactivate template (admin only)
router.delete("/templates/:id", authorize("admin"), ctrl.deleteTemplate);

module.exports = router;
