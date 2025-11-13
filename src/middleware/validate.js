const {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  productCreateSchema,
  productUpdateSchema,
  profileUpdateSchema,
} = require("../utils/validators");

const schemas = {
  register: registerSchema,
  login: loginSchema,
  changePassword: changePasswordSchema,
  productCreate: productCreateSchema,
  productUpdate: productUpdateSchema,
  profileUpdate: profileUpdateSchema,
};

function validate(schema) {
  return (req, res, next) => {
    const options = {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    };

    const { error, value } = schema.validate(req.body, options);

    if (error) {
      const message = error.details
        .map((d) => d.message.replace(/["]/g, ""))
        .join(", ");

      return res.status(400).json({
        status: "error",
        message,
      });
    }

    req.body = value;
    next();
  };
}

function validateRequest({ body, query, params }) {
  return (req, res, next) => {
    try {
      const errors = [];
      const options = {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      };

      if (body) {
        const result = body.validate(req.body, options);
        if (result.error) {
          errors.push(
            ...result.error.details.map((d) =>
              d.message.replace(/["]/g, "")
            )
          );
        } else {
          req.body = result.value;
        }
      }

      if (query) {
        const result = query.validate(req.query, options);
        if (result.error) {
          errors.push(
            ...result.error.details.map((d) =>
              d.message.replace(/["]/g, "")
            )
          );
        } else {
          req.query = result.value;
        }
      }

      if (params) {
        const result = params.validate(req.params, options);
        if (result.error) {
          errors.push(
            ...result.error.details.map((d) =>
              d.message.replace(/["]/g, "")
            )
          );
        } else {
          req.params = result.value;
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          status: "error",
          message: errors.join(", "),
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { validate, validateRequest, schemas };
