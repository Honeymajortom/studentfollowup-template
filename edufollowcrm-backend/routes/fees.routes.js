// routes/fees.routes.js
const router = require("express").Router();
const ctrl   = require("../controllers/fees.controller");
const { authenticate, authorize } = require("../middleware/auth");
const { validate, schemas }       = require("../middleware/validate");

router.use(authenticate);

// GET  /api/fees                   — all students fee list
router.get("/", ctrl.listFees);

// GET  /api/fees/dashboard         — KPI totals
router.get("/dashboard", ctrl.dashboard);

// GET  /api/fees/export            — CSV or PDF download
router.get("/export", ctrl.exportFees);

// POST /api/fees/payment           — record a new payment
router.post(
  "/payment",
  authorize("admin", "accountant", "counselor"),
  validate(schemas.createPayment),
  ctrl.addPayment
);

// POST /api/fees/bulk-payment      — record full pending amount for multiple students
router.post(
  "/bulk-payment",
  authorize("admin", "accountant", "counselor"),
  validate(schemas.bulkPayment),
  ctrl.bulkPayment
);

// GET  /api/fees/payment/:id/receipt  — download PDF receipt
router.get("/payment/:id/receipt", ctrl.downloadReceipt);

// GET  /api/fees/student/:studentId/payments
router.get("/student/:studentId/payments", ctrl.studentPayments);

module.exports = router;
