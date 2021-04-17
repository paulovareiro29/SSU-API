const routes = require("express")();

const router = require("./auth");
const authRoutes = require("./auth");
const userRoutes = require('./user')
const gigRoutes = require('./gig')
const roleRoutes = require('./role');

const utils = require("../utils");

router.get("/", (req, res) => {
    utils.sendResponse(res, 200, "Welcome to SSU API")
})

routes.use("/", authRoutes);
router.use("/user", userRoutes)
router.use("/gig", gigRoutes)
router.use("/role", roleRoutes)

module.exports = routes;
