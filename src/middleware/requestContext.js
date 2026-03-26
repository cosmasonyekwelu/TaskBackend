const { randomUUID } = require("crypto");
const logger = require("../lib/logger");

module.exports = (req, res, next) => {
  const requestId = req.headers["x-request-id"] || randomUUID();
  req.id = requestId;
  res.setHeader("x-request-id", requestId);

  const start = Date.now();
  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    logger[level]("http_request", {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      userId: req.user?.id,
      ip: req.ip
    });
  });

  next();
};
