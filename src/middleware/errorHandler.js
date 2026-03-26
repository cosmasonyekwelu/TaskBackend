const logger = require("../lib/logger");

const errorHandler = (err, req, res, next) => {
  logger.error("Unhandled application error", { err: err.message, stack: err.stack, requestId: req.id });

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err.name === "CastError") {
    statusCode = 404;
    message = `Resource not found (invalid ${err.path}).`;
  }

  if (err.code === 11000) {
    statusCode = 409;
    const fields = Object.keys(err.keyValue).join(", ");
    message = `Duplicate field value: ${fields}. Please use another value.`;
  }

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message || `Invalid value for ${e.path || "field"}.`)
      .join(", ");
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token. Please log in again.";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token has expired. Please log in again.";
  }

  if (message === "CORS origin not allowed.") {
    statusCode = 403;
  }

  const payload = {
    status: "error",
    message
  };

  if (process.env.NODE_ENV === "development") {
    payload.stack = err.stack;
  }

  return res.status(statusCode).json(payload);
};

module.exports = errorHandler;
