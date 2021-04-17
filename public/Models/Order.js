const Joi = require("joi");

module.exports = {
  model: Joi.object({
    user_id: Joi.number().integer(),
    gig_id: Joi.number().integer(),
    message: Joi.string().max(510),
    status_id: Joi.number().integer(),
  }),

  required: Joi.object({
    user_id: Joi.required(),
    gig_id: Joi.required(),
    message: Joi.optional(),
  }),

  updateModel: Joi.object({
    message: Joi.string().max(510),
  }),
};
