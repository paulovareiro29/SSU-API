const Joi = require("joi");

module.exports = {
  model: Joi.object({
    status_id: Joi.number().integer(),
  }),

  required: Joi.object({
    status_id: Joi.required(),
  }),
};
