const db = require("../database");

const utils = require("../utils");

module.exports = {
  async validateToken(req, res, next) {
    //  Authorization header format: Bearer token
    //  So there is a need to split "Bearer" from the "token"
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    //  Check if token is being sent on the Request Header
    if (token == null) {
      utils.sendError(res, 401, "Access Token not provided");
      return;
    }

    //  Get the user which holds the token
    const user = await db("user").where({ access_token: token }).first();

    //  If user doesn't exist, token is invalid
    if (!user) {
      utils.sendError(res, 401, "Access token is not valid");
      return;
    }

    //  Check if user is banned
    const banned = await db("ban").where({user_id: user.id}).first();

    if(banned){
      utils.sendError(res, 401,"You are banned. Reason: " + banned.reason)
      return;
    }


    //  Check expiration date of the token
    const currentTimestamp = new Date().valueOf() / 1000;

    if (user.access_token_ttl < currentTimestamp) {
      utils.sendError(res, 401, "Access token expired");
      return;
    }

    const isAdmin = await utils.isAdmin(res, {
      id: user.id,
      username: user.username,
    });

    req.user = {
      id: user.id,
      username: user.username,
      isAdmin: isAdmin
    };

    next();
  },
  async admin(req, res, next) {
    const adminRole = await db("role")
      .where({
        name: "admin",
      })
      .first();

    if (!adminRole) {
      utils.sendError(res, 500, "SERVER ERROR");
      return;
    }

    db("user_role")
      .where({
        user_id: req.user.id,
        role_id: adminRole.id,
      })
      .where("active", "=", 1)
      .then((result) => {
        if (result.length) {
          next();
          return;
        } else {
          utils.sendError(res, 401, "Only an administrator can do that");
          return;
        }
      });
  },
};
