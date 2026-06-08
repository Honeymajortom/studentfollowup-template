// routes/attendance.routes.js
const router = require("express").Router();
const ctrl   = require("../controllers/attendance.controller");
const { authenticate, authorize } = require("../middleware/auth");
const { validate, schemas }       = require("../middleware/validate");

router.use(authenticate);

// GET  /api/attendance?course_id=&date=       — fetch attendance sheet for a batch+date
router.get("/", ctrl.getByDate);

// POST /api/attendance                        — bulk mark (trainer, admin)
router.post(
  "/",
  authorize("admin", "trainer", "counselor"),
  validate(schemas.attendance),
  ctrl.markBulk
);

// GET  /api/attendance/student/:id/summary    — per-student attendance report
router.get("/student/:id/summary", ctrl.studentSummary);

module.exports = router;
