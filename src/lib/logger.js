const config = require("../config/env");

const levels = ["error", "warn", "info", "debug"];
const minLevelIndex = levels.indexOf(config.logging.level) >= 0 ? levels.indexOf(config.logging.level) : 2;

const sanitize = (data = {}) => {
  const clone = { ...data };
  if (clone.authorization) clone.authorization = "[REDACTED]";
  if (clone.password) clone.password = "[REDACTED]";
  if (clone.currentPassword) clone.currentPassword = "[REDACTED]";
  if (clone.newPassword) clone.newPassword = "[REDACTED]";
  return clone;
};

const log = (level, message, meta = {}) => {
  if (levels.indexOf(level) > minLevelIndex) return;
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: "taskbackend",
    message,
    ...sanitize(meta)
  };
  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else {
    console.log(line);
  }
};

module.exports = {
  error: (message, meta) => log("error", message, meta),
  warn: (message, meta) => log("warn", message, meta),
  info: (message, meta) => log("info", message, meta),
  debug: (message, meta) => log("debug", message, meta)
};
