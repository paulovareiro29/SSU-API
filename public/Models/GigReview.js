const Joi = require("joi");

module.exports = {
  model: Joi.object({
    gig_id: Joi.number().integer(),
    user_id: Joi.number().integer(),
    rating: Joi.number().integer().min(0).max(50),
    message: Joi.string().max(510),
  }),

  required: Joi.object({
    gig_id: Joi.required(),
    user_id: Joi.required(),
    rating: Joi.required(),
    message: Joi.optional(),
  }),

  updateModel: Joi.object({
    rating: Joi.number().integer().min(0).max(50),
    message: Joi.string().max(510),
  }),
};
