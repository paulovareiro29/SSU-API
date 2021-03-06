const db = require("../database");
const utils = require("../utils");
const bcrypt = require("bcrypt");

const model = require("../Models/Gig");

module.exports = {
  async index(req, res) {
    db("public_gig")
      .where({ deleted_at: null })
      .then(async (gigs) => {
        if (gigs) {
          if (!gigs.length) gigs = [gigs];

          gigs = await Promise.all(
            gigs.map(async (result) => {
              reviews = await db("gig_review").where({ gig_id: result.id });
              let rating = 0;
              let counter = 0;
              reviews &&
                reviews.forEach((review) => {
                  rating += review.rating;
                  counter++;
                });

              if (counter != 0) rating = rating / counter;

              result.rating = parseInt(rating);

              return result;
            })
          );
        }
        utils.sendResponse(res, 200, gigs);
      });
  },
  async get(req, res) {
    const gigID = req.params.gigID;

    db("public_gig")
      .where({ id: gigID })
      .first()
      .then(async (result) => {
        if (result) {
          result.owner = await db("public_user")
            .where({ username: result.owner })
            .first();

          db("gig_review")
            .where({ gig_id: result.id })
            .then((reviews) => {
              let rating = 0;
              let counter = 0;
              reviews &&
                reviews.forEach((review) => {
                  rating += review.rating;
                  counter++;
                });

              if (counter != 0) rating = rating / counter;

              result.rating = parseInt(rating);

              utils.sendResponse(res, 200, result);
            });
        } else {
          utils.sendError(res, 404, "Gig not found");
        }
      });
  },
  async insert(req, res) {
    //  User that requested
    const user = req.user;

    const gig = req.body;
    gig.user_id = user.id;

    const valid = utils.validateRequestModel(res, gig, model);
    if (!valid) return;

    db("gig")
      .insert(gig)
      .then((result) => {
        if (result) {
          gig.id = result[0];
          utils.log("NEW GIG", user.username + " created a new GIG");
          utils.sendResponse(res, 201, gig);
        } else {
          utils.sendError(res, 400, "Failed to create a new GIG");
        }
      });
  },
  async update(req, res) {
    const user = req.user;
    const gigID = req.params.gigID;

    const gig = await db("gig").where({ id: gigID }).first();

    //  Check if gig exists
    if (!gig) {
      utils.sendError(res, 404, "Gig not found");
      return;
    }

    //  Check if user that request is the owner of the gig or an admin
    if (gig.user_id != user.id && !user.isAdmin) {
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

    db("gig")
      .where(gig)
      .update(req.body)
      .then(async (result) => {
        if (result) {
          let gig = await db("gig").where({ id: gigID }).first();
          utils.sendResponse(res, 200, gig);
          return;
        }
      });
  },
  async delete(req, res) {
    const user = req.user;
    const gigID = req.params.gigID;

    const gig = await db("gig").where({ id: gigID }).first();

    //  Check if gig exists
    if (!gig) {
      utils.sendError(res, 404, "Gig not found");
      return;
    }

    //  Check if user that request is the owner of the gig or an admin
    if (gig.user_id != user.id && !user.isAdmin) {
      utils.sendError(res, 401, "Access denied");
      return;
    }

    //  Check if gig was already deleted
    if (gig.deleted_at) {
      utils.sendResponse(res, 200, "Gig was already deleted");
      return;
    }

    //  Update deleted_at
    db("gig")
      .where(gig)
      .update({ deleted_at: new Date().valueOf() / 1000 })
      .then((result) => {
        if (result) {
          utils.sendResponse(res, 200, "Gig deleted");
          return;
        }
        utils.sendError(res, 400, "Error deleting gig");
        return;
      });
  },
  async userIndex(req, res) {
    const userID = req.params.userID;
    db("public_gig")
      .where({ owner: userID })
      .first()
      .then(async (result) => {
        if (result) {
          if (!result.length) result = [result];

          result = await Promise.all(
            result.map(async (gig) => {
              let user = await db("public_user")
                .where({ username: gig.owner })
                .first();

              gig.owner = user;
              return gig;
            })
          );

          console.log(result);

          utils.sendResponse(res, 200, result);
          return;
        }

        utils.sendError(res, 404, "Gig not found");
      });
  },
};
