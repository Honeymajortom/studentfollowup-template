// routes/courses.routes.js
const router = require("express").Router();
const ctrl   = require("../controllers/courses.controller");
const { authenticate, authorize } = require("../middleware/auth");
const { validate, schemas }       = require("../middleware/validate");

router.use(authenticate);

router.get("/",     ctrl.list);
router.get("/:id",  ctrl.getOne);

router.post(
  "/",
  authorize("admin"),
  validate(schemas.createCourse),
  ctrl.create
);

router.patch(
  "/:id",
  authorize("admin"),
  ctrl.update
);

router.delete("/:id", authorize("admin"), ctrl.remove);

module.exports = router;
