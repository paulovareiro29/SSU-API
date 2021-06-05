const db = require("../database");
const utils = require("../utils");
const bcrypt = require("bcrypt");

module.exports = {
  async index(req, res) {
    res.send({});
  },
  async login(req, res) {
    const login = req.body;

    //  Check if request has the username and password fields
    if (!login.username || !login.password) {
      utils.sendError(res, 400, "Insuficient data");
      return;
    }

    const user = await db("user").where({ username: login.username }).first();

    //  User not found by username
    if (!user) {
      utils.sendError(res, 401, "Invalid login data");
      return;
    }

    //  Compare the passwords
    await bcrypt.compare(login.password, user.password, (err, result) => {
      
      //  If passwords are the same
      if (result) {

        //  Check if user is banned
        db("ban")
          .where({ user_id: user.id })
          .first()
          .then((isBanned) => {
            if (!isBanned) {
              const token = utils.generateToken();
              const tokenTTL = utils.generateTokenTTL();

              db("user")
                .where({
                  username: login.username,
                })
                .update("access_token", token)
                .update("access_token_ttl", tokenTTL)
                .then((result) => {
                  if (result) {
                    utils.sendResponse(res, 200, {
                      access_token: token,
                      access_token_ttl: tokenTTL,
                    });
                    return;
                  }
                });
            } else {
              utils.sendError(
                res,
                401,
                "You are banned. Reason: " + isBanned.reason
              );
              return;
            }
          });

        return;
      } else {
        utils.sendError(res, 401, "Invalid login data");
      }
    });
  },
  async userByToken(req, res){
    console.log(req.user)

    utils.sendResponse(res, 200, req.user)
  }
};
