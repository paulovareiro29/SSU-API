const router = require("express").Router();

const authMiddleware = require('../middlewares/AuthMiddleware.js')
const controller = require('../Controllers/AuthController')

router.get("/auth", authMiddleware.validateToken ,controller.userByToken);
router.post("/login", controller.login)


module.exports = router
