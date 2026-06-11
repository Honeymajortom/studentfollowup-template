// routes/leads.routes.js
const router = require("express").Router();
const ctrl   = require("../controllers/leads.controller");
const { authenticate, authorize } = require("../middleware/auth");
const { validate, schemas }       = require("../middleware/validate");

router.use(authenticate);

// GET  /api/leads              — list with search / filter / pagination
router.get("/", ctrl.list);

// GET  /api/leads/:id          — single lead
router.get("/:id", ctrl.getOne);

// POST /api/leads              — create (admin, counselor)
router.post(
  "/",
  authorize("admin", "counselor"),
  validate(schemas.createLead),
  ctrl.create
);

// PATCH /api/leads/:id         — update (admin, counselor)
router.patch(
  "/:id",
  authorize("admin", "counselor"),
  validate(schemas.updateLead),
  ctrl.update
);

// DELETE /api/leads/:id        — admin only
router.delete("/:id", authorize("admin"), ctrl.remove);

// POST /api/leads/:id/convert  — convert lead → student (admin, counselor)
router.post(
  "/:id/convert",
  authorize("admin", "counselor"),
  validate(schemas.convertLead),
  ctrl.convert
);

// GET /api/leads/:id/timeline  — audit trail for this lead
router.get("/:id/timeline", ctrl.timeline);

module.exports = router;
