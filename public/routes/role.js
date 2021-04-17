const router = require("express").Router();
const auth = require("../middlewares/authMiddleware");
const controller = require("../Controllers/RoleController");

router.get("/", auth.validateToken, auth.admin, controller.index);
router.post("/", auth.validateToken, auth.admin, controller.insert);

router.post("/associate", auth.validateToken, auth.admin, controller.associate);
router.post(
  "/disassociate",
  auth.validateToken,
  auth.admin,
  controller.disassociate
);

module.exports = router;
