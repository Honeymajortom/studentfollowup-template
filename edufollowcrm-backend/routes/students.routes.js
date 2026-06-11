// routes/students.routes.js
const router = require("express").Router();
const ctrl   = require("../controllers/students.controller");
const { authenticate, authorize } = require("../middleware/auth");
const { validate, schemas }       = require("../middleware/validate");

// All student routes require authentication
router.use(authenticate);

// PATCH  /api/students/bulk-assign  — must be before /:id
router.patch(
  "/bulk-assign",
  authorize("admin", "counselor"),
  validate(schemas.bulkAssign),
  ctrl.bulkAssign
);

// GET    /api/students/export     — CSV or PDF download (must be before /:id)
router.get("/export", ctrl.exportStudents);

// GET    /api/students            — list with search/filter/pagination
router.get("/", ctrl.list);

// POST   /api/students            — create (admin, counselor)
router.post(
  "/",
  authorize("admin", "counselor"),
  validate(schemas.createStudent),
  ctrl.create
);

// GET    /api/students/:id        — single student full profile
router.get("/:id", ctrl.getOne);

// PATCH  /api/students/:id        — update (admin, counselor)
router.patch(
  "/:id",
  authorize("admin", "counselor"),
  validate(schemas.updateStudent),
  ctrl.update
);

// DELETE /api/students/:id        — admin only
router.delete("/:id", authorize("admin"), ctrl.remove);

// Sub-resources
router.get("/:id/followups",  ctrl.getFollowups);
router.get("/:id/payments",   ctrl.getPayments);
router.get("/:id/attendance", ctrl.getAttendance);
router.get("/:id/wa-logs",    ctrl.getWaLogs);

module.exports = router;
