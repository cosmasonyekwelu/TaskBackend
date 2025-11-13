const errorHandler = (err, req, res, next) => {
  console.error("ERROR =>", err);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err.name === "CastError") {
    statusCode = 404;
    message = `Resource not found (invalid ${err.path}).`;
  }

  if (err.code === 11000) {
    statusCode = 400;
    const fields = Object.keys(err.keyValue).join(", ");
    message = `Duplicate field value: ${fields}. Please use another value.`;
  }

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(", ");
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token. Please log in again.";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token has expired. Please log in again.";
  }

  if (err.name === "AppError" && err.isOperational) {
    statusCode = err.statusCode || 400;
    message = err.message;
  }

  return res.status(statusCode).json({
    status: "error",
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
