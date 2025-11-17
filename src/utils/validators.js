const Joi = require("joi");

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};:'",<.>/?\\|`~]).{8,}$/;

const passwordRule = Joi.string()
  .min(8)
  .pattern(passwordPattern)
  .messages({
    "string.min": "Password must be at least 8 characters long.",
    "string.pattern.base":
      "Password must contain uppercase, lowercase, number, and special character.",
    "string.empty": "Password is required."
  });

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).trim().required().messages({
    "string.empty": "Name is required."
  }),
  email: Joi.string().email().trim().required().messages({
    "string.email": "A valid email is required.",
    "string.empty": "Email is required."
  }),
  password: passwordRule.required(),
  role: Joi.string().valid("user", "admin").optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().trim().required().messages({
    "string.email": "A valid email is required.",
    "string.empty": "Email is required."
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password is required."
  })
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "string.empty": "Current password is required."
  }),
  newPassword: passwordRule.required()
});

const productCreateSchema = Joi.object({
  title: Joi.string().trim().min(1).required().messages({
    "string.empty": "Product title is required."
  }),
  description: Joi.string().allow("", null).trim(),
  price: Joi.number().min(0).required().messages({
    "number.base": "Price must be a valid number.",
    "any.required": "Price is required."
  }),
  stock: Joi.number().integer().min(0).default(0)
});

const productUpdateSchema = Joi.object({
  title: Joi.string().trim().min(1),
  description: Joi.string().allow("", null).trim(),
  price: Joi.number().min(0),
  stock: Joi.number().integer().min(0)
}).min(1);

const profileUpdateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50),
  email: Joi.string().email().trim()
}).min(1);

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  productCreateSchema,
  productUpdateSchema,
  profileUpdateSchema
};
