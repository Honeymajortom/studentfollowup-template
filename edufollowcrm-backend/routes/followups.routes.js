// routes/followups.routes.js
const router = require("express").Router();
const ctrl   = require("../controllers/followups.controller");
const { authenticate, authorize } = require("../middleware/auth");
const { validate, schemas }       = require("../middleware/validate");

router.use(authenticate);

// GET  /api/followups             — list (filtered by date, status, assignee)
router.get("/", ctrl.list);

// GET  /api/followups/today-summary
router.get("/today-summary", ctrl.todaySummary);

// GET  /api/followups/notifications
router.get("/notifications", ctrl.notifications);

// POST /api/followups             — schedule a new follow-up
router.post(
  "/",
  authorize("admin", "counselor"),
  validate(schemas.createFollowup),
  ctrl.create
);

// PATCH /api/followups/:id/complete
router.patch(
  "/:id/complete",
  authorize("admin", "counselor"),
  validate(schemas.completeFollowup),
  ctrl.complete
);

// DELETE /api/followups/:id
router.delete("/:id", authorize("admin"), ctrl.remove);

module.exports = router;
