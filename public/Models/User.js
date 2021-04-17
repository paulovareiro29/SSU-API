const Joi = require("joi");

module.exports = {
  model: Joi.object({
    username: Joi.string().alphanum().min(8).max(32),

    password: Joi.string().alphanum().min(8).max(255),

    first_name: Joi.string()
      .regex(/^[A-Za-z ]+$/)
      .min(1)
      .max(255),

    last_name: Joi.string()
      .pattern(/^[A-Za-z ]+$/)
      .min(1)
      .max(255),

    email: Joi.string().email().max(255),

    birth_date: Joi.number().integer(),
  }),

  required: Joi.object({
    username: Joi.required(),
    password: Joi.required(),
    first_name: Joi.required(),
    email: Joi.required(),
    birth_date: Joi.required(),
  }),

  updateModel: Joi.object({
    password: Joi.string().alphanum().min(8).max(255),

    first_name: Joi.string()
      .regex(/^[A-Za-z ]+$/)
      .min(1)
      .max(255),

    last_name: Joi.string()
      .pattern(/^[A-Za-z ]+$/)
      .min(1)
      .max(255),

    email: Joi.string().email().max(255),

    birth_date: Joi.number().integer(),
  }),
};
