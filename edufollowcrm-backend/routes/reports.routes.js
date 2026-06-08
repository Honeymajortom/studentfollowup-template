// routes/reports.routes.js
const router = require("express").Router();
const ctrl   = require("../controllers/reports.controller");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate);

// GET /api/reports/dashboard          — all KPIs in one shot
router.get("/dashboard", ctrl.dashboardKPIs);

// GET /api/reports/admissions         — monthly admission trend
router.get("/admissions", ctrl.admissions);

// GET /api/reports/fees               — monthly fee collection
router.get("/fees", ctrl.feesReport);

// GET /api/reports/lead-sources       — pie chart data
router.get("/lead-sources", ctrl.leadSources);

// GET /api/reports/staff-performance  — counselor comparison
router.get(
  "/staff-performance",
  authorize("admin"),
  ctrl.staffPerformance
);

// GET /api/reports/course-performance — revenue & enrollment per course
router.get("/course-performance", ctrl.coursePerformance);

// GET /api/reports/attendance-summary — attendance rate per student
router.get("/attendance-summary", ctrl.attendanceSummary);

module.exports = router;
