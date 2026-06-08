// routes/staff.routes.js
const router = require("express").Router();
const ctrl   = require("../controllers/staff.controller");
const { authenticate, authorize } = require("../middleware/auth");
const { validate, schemas }       = require("../middleware/validate");

router.use(authenticate);

// GET  /api/staff                 — list all staff
router.get("/", ctrl.list);

// GET  /api/staff/:id             — single staff member
router.get("/:id", ctrl.getOne);

// POST /api/staff                 — admin only creates accounts
router.post(
  "/",
  authorize("admin"),
  validate(schemas.createStaff),
  ctrl.create
);

// PATCH /api/staff/:id            — admin updates details
router.patch("/:id", authorize("admin"), ctrl.update);

// POST /api/staff/:id/assign-leads
router.post(
  "/:id/assign-leads",
  authorize("admin"),
  ctrl.assignLeads
);

// GET  /api/staff/:id/performance
router.get("/:id/performance", ctrl.performance);

module.exports = router;
