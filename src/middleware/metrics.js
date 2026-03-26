const { observeRequest } = require("../lib/metrics");

module.exports = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    observeRequest({ statusCode: res.statusCode, durationMs });
  });

  next();
};
