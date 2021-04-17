const Joi = require("joi");

module.exports = {
  model: Joi.object({
    name: Joi.string()
      .pattern(/^[A-Za-z ]+$/)
      .min(3)
      .max(32),
    description: Joi.string().min(8).max(255),
  }),

  required: Joi.object({
    name: Joi.required(),
    description: Joi.optional(),
  }),

  associate: Joi.object({
    user: Joi.string().alphanum().min(8).max(32).required(),
    role: Joi.string()
      .pattern(/^[A-Za-z ]+$/)
      .min(3)
      .max(32)
      .required(),
  }),
};
