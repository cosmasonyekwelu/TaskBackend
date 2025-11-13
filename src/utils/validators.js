const Joi = require("joi");

const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};:'",<.>/?\\|`~]).{8,}$/;

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).trim().required(),
  email: Joi.string().email().trim().required(),
  password: Joi.string().pattern(passwordPattern).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().trim().required(),
  password: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().pattern(passwordPattern).required(),
});

const productCreateSchema = Joi.object({
  title: Joi.string().trim().min(1).required(),
  description: Joi.string().allow("", null).trim(),
  price: Joi.number().min(0).required(),
  stock: Joi.number().integer().min(0).default(0),
});

const productUpdateSchema = Joi.object({
  title: Joi.string().trim().min(1),
  description: Joi.string().allow("", null).trim(),
  price: Joi.number().min(0),
  stock: Joi.number().integer().min(0),
}).min(1);

const profileUpdateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50),
  email: Joi.string().email().trim(),
}).min(1);

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  productCreateSchema,
  productUpdateSchema,
  profileUpdateSchema,
};
