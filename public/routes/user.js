const router = require("express").Router();
const auth = require("../middlewares/AuthMiddleware");
const controller = require("../Controllers/UserController");

const orderController = require("../Controllers/OrderController");

router.post("/register", controller.insert);

router.get("/", auth.validateToken, auth.admin, controller.index);
router.get("/:userID", controller.get);
router.put("/:userID", auth.validateToken, controller.update);
router.delete("/:userID", auth.validateToken, controller.delete);


router.get("/:userID/orders", auth.validateToken, orderController.userIndex);

module.exports = router;
