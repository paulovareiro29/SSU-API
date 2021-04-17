const db = require("../database");
const utils = require("../utils");
const bcrypt = require("bcrypt");

const model = require("../Models/User");

module.exports = {
  async index(req, res) {
    db("public_user").then(async (users) => {
      user = await Promise.all(
        users.map(async (user) => {
          let ban = await db("ban").where({ user_id: user.id }).first();

          ban
            ? (user.ban = {
                reason: ban.reason,
                banned_at: ban.banned_at,
              })
            : (user.ban = null);

          return user;
        })
      );

      utils.sendResponse(res, 200, users);
      return;
    });
  },
  async get(req, res) {
    const userID = req.params.userID;

    db("public_user")
      .where({
        username: userID,
      })
      .first()
      .then(async (result) => {
        if (result) {
          let ban = await db("ban").where({ user_id: result.id }).first();

          ban
            ? (result.ban = {
                reason: ban.reason,
                banned_at: ban.banned_at,
              })
            : (result.ban = null);

          utils.sendResponse(res, 200, result);
        } else {
          utils.sendError(res, 404, "User not found");
        }
      });
  },
  async insert(req, res) {
    const user = req.body;

    const valid = utils.validateRequestModel(res, user, model);
    if (!valid) return;

    //  Verifies if username already exists
    db("user")
      .where({
        username: user.username,
      })
      .first()
      .then((result) => {
        //  If it doesn't exist
        if (!result) {
          //  Hashs the password
          bcrypt.hash(
            user.password,
            parseInt(process.env.CRYPT_SALT_ROUNDS),
            (err, hash) => {
              if (err) {
                utils.sendError(res, 400, err);
                return;
              }

              user.password = hash;

              //  Creates the user
              db("user")
                .insert(user)
                .then((result) => {
                  if (result) {
                    user.id = result[0];
                    utils.log("NEW ACCOUNT", user.username + " was created");
                    utils.sendResponse(res, 201, user);
                  } else {
                    utils.sendError(res, 400, "Failed to create new account");
                  }
                });
            }
          );
        } else {
          utils.sendError(res, 400, "Username already exists");
        }
      });
  },
  async update(req, res) {
    const userID = req.params.userID;

    const user = await db("user").where({ username: userID }).first();

    //  Check if user exists
    if (!user) {
      utils.sendError(res, 404, "User not found");
      return;
    }

    //  Check if user that request is the user or an admin
    if (userID != req.user.username && !req.user.isAdmin) {
      utils.sendError(res, 401, "Access denied");
      return;
    }

    //  Check if body is empty
    let isEmpty = true;
    for (let i in req.body) {
      isEmpty = false;
      break;
    }

    if (isEmpty) {
      utils.sendError(res, 400, "Request body cannot be empty");
      return;
    }

    const valid = utils.validateUpdateRequestModel(res, req.body, model);
    if (!valid) return;

    if (req.body.password) {
      bcrypt.hash(
        req.body.password,
        parseInt(process.env.CRYPT_SALT_ROUNDS),
        (err, hash) => {
          if (err) {
            utils.sendError(res, 400, err);
            return;
          }

          req.body.password = hash;

          db("user")
            .where(user)
            .update(req.body)
            .then(async (result) => {
              if (result) {
                let user = await db("public_user")
                  .where({ username: userID })
                  .first();
                utils.sendResponse(res, 200, user);
                return;
              }
            });
          return;
        }
      );
      return;
    }

    db("user")
      .where(user)
      .update(req.body)
      .then(async (result) => {
        if (result) {
          let user = await db("public_user")
            .where({ username: userID })
            .first();
          utils.sendResponse(res, 200, user);
          return;
        }
      });
  },
  async delete(req, res) {
    const userID = req.params.userID;

    const user = await db("user").where({ username: userID }).first();

    //  Check if user exists
    if (!user) {
      utils.sendError(res, 404, "User not found");
      return;
    }

    //  Check if user that request is the user or an admin
    if (userID != req.user.username && !req.user.isAdmin) {
      utils.sendError(res, 401, "Access denied");
      return;
    }

    //  Check if gig was already deleted
    if (user.deleted_at) {
      utils.sendResponse(res, 200, "User was already deleted");
      return;
    }

    //  Update deleted_at
    db("user")
      .where(user)
      .update({ deleted_at: new Date().valueOf() / 1000 })
      .then((result) => {
        if (result) {
          utils.sendResponse(res, 200, "User deleted");
          return;
        }
        utils.sendError(res, 400, "Error deleting User");
        return;
      });
  },
};
