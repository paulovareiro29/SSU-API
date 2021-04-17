const router = require("express").Router();

const authMiddleware = require('../middlewares/authMiddleware')
const controller = require('../Controllers/AuthController')

router.get("/auth", authMiddleware.validateToken ,controller.index);
router.post("/login", controller.login)


module.exports = router
