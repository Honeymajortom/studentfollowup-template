// routes/index.js
// Central route registry — mounted at /api in app.js

const router = require("express").Router();

router.use("/auth",       require("./auth.routes"));
router.use("/students",   require("./students.routes"));
router.use("/leads",      require("./leads.routes"));
router.use("/followups",  require("./followups.routes"));
router.use("/fees",       require("./fees.routes"));
router.use("/courses",    require("./courses.routes"));
router.use("/attendance", require("./attendance.routes"));
router.use("/staff",      require("./staff.routes"));
router.use("/whatsapp",   require("./whatsapp.routes"));
router.use("/reports",    require("./reports.routes"));

// Health-check (no auth needed)
router.get("/health", (req, res) =>
  res.json({
    status:    "ok",
    timestamp: new Date().toISOString(),
    uptime:    Math.floor(process.uptime()) + "s",
    env:       process.env.NODE_ENV,
  })
);

module.exports = router;
