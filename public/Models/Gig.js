const Joi = require("joi");

module.exports = {
  model: Joi.object({
    user_id: Joi.number().integer(),
    title: Joi.string()
      .pattern(/^[A-Za-z ]+$/)
      .min(8)
      .max(255),
    description: Joi.string().min(55).max(1200),
    subject: Joi.string().min(3).max(55),
    price: Joi.number(),
  }),

  required: Joi.object({
    user_id: Joi.required(),
    title: Joi.required(),
    description: Joi.required(),
    subject: Joi.required(),
    price: Joi.optional(),
  }),

  updateModel: Joi.object({
    title: Joi.string()
      .pattern(/^[A-Za-z ]+$/)
      .min(8)
      .max(255),
    description: Joi.string().min(55).max(1200),
    subject: Joi.string().min(3).max(55),
    price: Joi.number(),
  }),
};
