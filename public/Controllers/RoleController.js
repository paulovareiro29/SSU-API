const db = require("../database");
const utils = require("../utils");
const bcrypt = require("bcrypt");

const model = require("../Models/Role");

module.exports = {
  async index(req, res) {
    db("role").then((result) => {
      utils.sendResponse(res, 200, result);
    });
  },
  async insert(req, res) {
    const role = req.body;

    const requiredValidation = model.required.validate(role);

    if (requiredValidation.error) {
      utils.sendError(res, 400, requiredValidation.error.details[0].message);
      return;
    }

    const validation = model.model.validate(role);

    if (validation.error) {
      utils.sendError(res, 400, validation.error.details[0].message);
      return;
    }

    //  Verifies if role name already exists
    db("role")
      .where({
        name: role.name,
      })
      .first()
      .then((result) => {
        //  If it doesn't exist, creates it
        if (!result) {
          db("role")
            .insert(role)
            .then((result) => {
              if (result) {
                role.id = result[0];

                utils.log(
                  "NEW ROLE",
                  req.user.username + " created a new role"
                );
                utils.sendResponse(res, 201, role);
              } else {
                utils.sendError(res, 400, "Failed to create a new role");
                return;
              }
            });
        } else {
          utils.sendError(res, 400, "Role already exists");
          return;
        }
      });
  },
  async associate(req, res) {
    const validation = model.associate.validate(req.body);

    if (validation.error) {
      utils.sendError(res, 400, validation.error.details[0].message);
      return;
    }

    const user = await db("public_user")
      .where({ username: req.body.user })
      .first();
    if (!user) {
      utils.sendError(res, 400, "User not found");
      return;
    }

    const role = await db("role").where({ name: req.body.role }).first();
    if (!role) {
      utils.sendError(res, 400, "Role not found");
      return;
    }

    db("user_role")
      .where({
        user_id: user.id,
        role_id: role.id,
      })
      .then((result) => {
        if (!result) {
          db("user_role")
            .insert({
              user_id: user.id,
              role_id: role.id,
            })
            .then((result) => {
              if (result) {
                utils.log(
                  "ROLE ASSOCIATED",
                  `${user.username} was added to [ ${role.name} ]`
                );
                utils.sendResponse(res, 200, {
                  user: user,
                  role: role,
                  active: true,
                  added_at: new Date().valueOf() / 1000,
                });
                return;
              } else {
                utils.sendError(
                  res,
                  400,
                  `Failed to associate [ ${user.username} ] to [ ${role.name} ]`
                );
                return;
              }
            });
        } else {
          db("user_role")
            .where({
              user_id: user.id,
              role_id: role.id,
            })
            .where("active", "<>", 1)
            .update({
              active: 1,
            })
            .then((result) => {
              if (result) {
                utils.log(
                  "ROLE ASSOCIATED",
                  `${user.username} was added to [ ${role.name} ]`
                );
                utils.sendResponse(res, 200, {
                  user: user,
                  role: role,
                  active: true,
                  added_at: new Date().valueOf() / 1000,
                });
                return;
              } else {
                utils.sendError(
                  res,
                  400,
                  `[ ${user.username} ] already is [ ${role.name} ]`
                );
                return;
              }
            });
        }
      });
  },
  async disassociate(req, res) {
    const validation = model.associate.validate(req.body);

    if (validation.error) {
      utils.sendError(res, 400, validation.error.details[0].message);
      return;
    }

    const user = await db("public_user")
      .where({ username: req.body.user })
      .first();
    if (!user) {
      utils.sendError(res, 400, "User not found");
      return;
    }

    const role = await db("role").where({ name: req.body.role }).first();
    if (!role) {
      utils.sendError(res, 400, "Role not found");
      return;
    }

    //  Find the row
    db("user_role")
      .where({
        user_id: user.id,
        role_id: role.id,
      })
      .then((result) => {
        //  If row was found
        if (result) {
          //  Update if active is different from 0
          db("user_role")
            .where({
              user_id: user.id,
              role_id: role.id,
            })
            .where("active", "<>", 0)
            .update({
              active: 0,
            })
            .then((result) => {
              if (result) {
                utils.log(
                  "ROLE DISASSOCIATED",
                  `${user.username} was removed from [ ${role.name} ]`
                );
                utils.sendResponse(res, 200, {
                  user: user,
                  role: role,
                  active: false,
                  added_at: (new Date().valueOf() / 1000).toFixed(0),
                });
                return;
              } else {
                utils.sendError(
                  res,
                  400,
                  `[ ${user.username} ] already isn't [ ${role.name} ]`
                );
                return;
              }
            });
        } else {
          utils.sendError(
            res,
            400,
            `[ ${user.username} ] already isn't [ ${role.name} ]`
          );
        }
      });
  },
};
