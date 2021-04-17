const router = require("express").Router();
const auth = require("../middlewares/AuthMiddleware");
const controller = require("../Controllers/GigController");

const orderController = require("../Controllers/OrderController");
const reviewController = require("../Controllers/GigReviewController");

router.get("/", controller.index);
router.get("/:gigID", controller.get);
router.post("/", auth.validateToken, controller.insert);
router.put("/:gigID", auth.validateToken, controller.update);
router.delete("/:gigID", auth.validateToken, controller.delete);

/*  ORDERS  */
router.get("/:gigID/orders", auth.validateToken, orderController.index);
router.post("/:gigID/orders", auth.validateToken, orderController.insert);
router.put("/:gigID/orders/:orderID", auth.validateToken, orderController.update)
// router.delete("/:gigID/orders/:orderID", auth.validateToken, orderController.delete)

/** ORDER STATUS */
router.put(
  "/:gigID/orders/:orderID/status",
  auth.validateToken,
  orderController.status
);



/** REVIEWS */
router.get("/:gigID/reviews", reviewController.index);
router.post("/:gigID/reviews", auth.validateToken, reviewController.create);
router.put("/:gigID/reviews/:reviewID", auth.validateToken, reviewController.update);
router.delete("/:gigID/reviews/:reviewID", auth.validateToken, reviewController.delete);

module.exports = router;
