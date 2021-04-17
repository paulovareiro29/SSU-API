const db = require("../database");
const utils = require("../utils");
const bcrypt = require("bcrypt");

const model = require("../Models/GigReview");

module.exports = {
  async index(req, res) {
    const gigID = req.params.gigID;

    db("gig")
      .where({ id: gigID })
      .first()
      .then((gig) => {
        if (gig) {
          db("gig_review")
            .where({ gig_id: gigID, deleted_at: null })
            .then(async (reviews) => {
              if (reviews.length) {
                reviews = await Promise.all(
                  reviews.map(async (review) => {
                    let user = await db("user")
                      .where({ id: review.user_id })
                      .first();

                    return {
                      id: review.id,
                      rating: review.rating,
                      message: review.message,
                      user: {
                        id: user.id,
                        username: user.username,
                      },
                    };
                  })
                );

                utils.sendResponse(res, 200, reviews);
              } else {
                utils.sendResponse(res, 200, reviews);
              }
            });
        } else {
          utils.sendError(res, 404, "Gig not found");
        }
      });
  },
  async create(req, res) {
    const gigID = req.params.gigID;
    const review = req.body;

    //  Check if gig exists
    db("gig")
      .where({ id: gigID })
      .first()
      .then((gig) => {
        if (gig) {
          //  Verify if the user that the gig isn't the owner
          if (gig.user_id == req.user.id) {
            utils.sendError(
              res,
              401,
              "The owner of the gig can't place a review."
            );
            return;
          }

          review.gig_id = gigID;
          review.user_id = req.user.id;

          const valid = utils.validateRequestModel(res, review, model);
          if (!valid) return;

          db("gig_review")
            .insert(review)
            .then((result) => {
              if (result) {
                db("user")
                  .where({ id: review.user_id })
                  .first()
                  .then((user) => {
                    utils.log(
                      "NEW REVIEW",
                      "New review was placed on gig with ID:" +
                        gig.id +
                        " - USER: " +
                        user.username
                    );
                    utils.sendResponse(res, 201, review);
                  });
              } else {
                utils.sendError(res, 400, "Failed to place a review");
              }
            });
        } else {
          utils.sendError(res, 404, "Gig not found");
        }
      });
  },
  async update(req, res) {
    const gigID = req.params.gigID;
    const reviewID = req.params.reviewID;

    const gig = await db("gig").where({ id: gigID }).first();

    //  Check if gig exists
    if (!gig) {
      utils.sendError(res, 404, "Gig not found");
      return;
    }

    const review = await db("gig_review").where({ id: reviewID }).first();
    if (!review) {
      utils.sendError(res, 404, "Review not found");
      return;
    }

    //  Check if user that request is the user or an admin
    if (review.user_id != req.user.id && !req.user.isAdmin) {
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

    db("gig_review")
      .where(review)
      .update(req.body)
      .then(async (result) => {
        if (result) {
          let review = await db("gig_review").where({ id: reviewID }).first();
          utils.sendResponse(res, 200, review);
          return;
        }
      });
  },
  async delete(req, res) {
    const gigID = req.params.gigID;
    const reviewID = req.params.reviewID;

    const gig = await db("gig").where({ id: gigID }).first();

    //  Check if gig exists
    if (!gig) {
      utils.sendError(res, 404, "Gig not found");
      return;
    }

    const review = await db("gig_review").where({ id: reviewID }).first();
    if (!review) {
      utils.sendError(res, 404, "Review not found");
      return;
    }

    //  Check if user that request is the user or an admin
    if (review.user_id != req.user.id && !req.user.isAdmin) {
      utils.sendError(res, 401, "Access denied");
      return;
    }

    if (review.deleted_at) {
      utils.sendResponse(res, 200, "Review was already deleted");
      return;
    }

    db("gig_review")
      .where(review)
      .update({
        deleted_at: new Date().valueOf() / 1000,
      })
      .then(async (result) => {
        if (result) {
          let review = await db("gig_review").where({ id: reviewID }).first();
          utils.sendResponse(res, 200, review);
          return;
        }
      });
  },
};
