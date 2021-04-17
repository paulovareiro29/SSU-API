const db = require("../database");
const utils = require("../utils");
const bcrypt = require("bcrypt");

const model = require("../Models/Order");

const statusModel = require("../Models/Status");

module.exports = {
  async index(req, res) {
    const gigID = req.params.gigID;

    db("gig")
      .where({ id: gigID })
      .first()
      .then(async (result) => {
        if (result) {
          //  Verify if the user that requested the orders on the gig is the owner of the gig or is an Admin
          if (result.user_id == req.user.id || req.user.isAdmin) {
            let orders = await db("order").where({ gig_id: gigID });

            orders = await Promise.all(
              orders.map(async (order, key) => {
                let status = await db("status")
                  .where("id", order.status_id)
                  .first();

                let client = await db("user")
                  .where({ id: order.user_id })
                  .first();

                //  In case the client was deleted from DB
                // if (!client)
                //   client = {
                //     id: null,
                //     username: null,
                //   };

                return {
                  id: order.id,
                  message: order.message,
                  client: {
                    id: client.id,
                    username: client.username,
                  },
                  status: status,
                };
              })
            );

            utils.sendResponse(res, 200, orders);
          } else {
            utils.sendError(res, 403, "Access denied");
          }
        } else {
          utils.sendError(res, 404, "Gig not found");
        }
      });
  },
  async insert(req, res) {
    const gigID = req.params.gigID;

    const order = req.body;

    db("gig")
      .where({ id: gigID })
      .first()
      .then((gig) => {
        //  Verify if the user that the gig isn't the owner
        if (gig.user_id == req.user.id) {
          utils.sendError(
            res,
            401,
            "The owner of the gig can't request an order."
          );
          return;
        }

        order.gig_id = gigID;
        order.user_id = req.user.id;
        const valid = utils.validateRequestModel(res, order, model);

        if (!valid) return;

        db("order")
          .insert(order)
          .then((result) => {
            if (result) {
              db("order_status")
                .insert({
                  order_id: result,
                  status_id: 1,
                })
                .then(() => {});

              db("user")
                .where({ id: gig.user_id })
                .first()
                .then((user) => {
                  utils.log(
                    "NEW ORDER",
                    "New order was placed on gig with ID:" +
                      gig.id +
                      " - USER: " +
                      user.username
                  );
                  utils.sendResponse(res, 201, order);
                });
            } else {
              utils.sendError(res, 400, "Failed to place the order");
            }
          });
      });
  },
  async status(req, res) {
    const gigID = req.params.gigID;
    const orderID = req.params.orderID;

    const newStatus = req.body;

    // const userIsAdmin = await utils.isAdmin(res, req.user);

    //  Get the gig from database
    const gig = await db("gig")
      .where({
        id: gigID,
      })
      .first();

    //  Check if the user that request is the owner
    if (gig.user_id != req.user.id && !req.user.isAdmin) {
      utils.sendError(res, 401, "Only the owner of the gig can change");
      return;
    }

    //  Check if order exists
    const order = await db("order")
      .where({
        id: orderID,
        gig_id: gigID,
      })
      .first();

    if (!order) {
      utils.sendError(res, 400, "Order doesn't exist");
      return;
    }

    //  Check if request body (new status) is valid
    const valid = utils.validateRequestModel(res, newStatus, statusModel);
    if (!valid) return;

    //  Check if new status exists
    const status = await db("status")
      .where({
        id: newStatus.status_id,
      })
      .first();

    if (!status) {
      utils.sendError(res, 400, "New status isn't valid");
      return;
    }

    if (order.status_id == newStatus.status_id) {
      utils.sendError(res, 400, "Order already is status " + status.name);
      return;
    }

    //  Update order status
    db("order")
      .where(order)
      .update({
        status_id: status.id,
      })
      .then((result) => {
        if (result) {
          db("order_status")
            .insert({
              order_id: order.id,
              status_id: status.id,
            })
            .then(async (result) => {
              if (result) {
                let user = await db("user")
                  .where({ id: order.user_id })
                  .first();

                utils.log(
                  "STATUS UPDATE",
                  "ORDER: " + order.id + " - STATUS: " + status.name
                );
                utils.sendResponse(res, 200, {
                  id: order.id,
                  user: user.username,
                  message: order.message,
                  status: status,
                  created_at: order.created_at,
                });
                return;
              }
            });
        }
      });
  },

  async update(req, res) {
    const gigID = req.params.gigID;
    const orderID = req.params.orderID;

    const gig = await db("gig").where({ id: gigID }).first();

    //  Check if gig exists
    if (!gig) {
      utils.sendError(res, 404, "Gig not found");
      return;
    }

    const order = await db("order").where({ id: orderID }).first();
    if (!order) {
      utils.sendError(res, 404, "Order not found");
      return;
    }

    //  Check if user that request is the user or an admin
    if (gig.user_id != req.user.id && !req.user.isAdmin) {
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

    db("order")
      .where(order)
      .update(req.body)
      .then(async (result) => {
        if (result) {
          let order = await db("order").where({ id: orderID }).first();
          utils.sendResponse(res, 200, order);
          return;
        }
      });
  },

  // async delete(req, res) {
  //   // SEND MESSAGE TO GIG OWNER TO CANCEL
  // },

  async userIndex(req, res) {
    const userID = req.params.userID;

    //  Verify if its the user that requested or an admin
    if (req.user.id != userID && !req.user.isAdmin) {
      utils.sendError(res, 401, "Access denied");
      return;
    }

    let user = await db("user").where({ id: userID }).first();

    if (!user) {
      utils.sendError(res, 404, "User not found");
      return;
    }

    let orders = await db("order").where({ user_id: userID });

    orders = await Promise.all(
      orders.map(async (order) => {
        let status = await db("status").where("id", order.status_id).first();

        return {
          id: order.id,
          message: order.message,
          client: {
            id: user.id,
            username: user.username,
          },
          status: status,
        };
      })
    );

    utils.sendResponse(res, 200, orders);
  },
};
