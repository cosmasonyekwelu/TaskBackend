const required = ["MONGODB_URI", "JWT_ACCESS_SECRET"];

const parseNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseOrigins = (raw) => {
  if (!raw || raw === "*") return ["*"];
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const config = {
  env: process.env.NODE_ENV || "development",
  port: parseNumber(process.env.PORT, 3000),
  mongodbUri: process.env.MONGODB_URI,
  jwt: {
    secret: process.env.JWT_ACCESS_SECRET,
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "24h",
    issuer: process.env.JWT_ISSUER || "taskbackend",
    audience: process.env.JWT_AUDIENCE || "taskbackend-clients"
  },
  bcryptRounds: parseNumber(process.env.BCRYPT_ROUNDS, 12),
  jsonLimit: process.env.JSON_LIMIT || "1mb",
  corsOrigins: parseOrigins(process.env.CORS_ORIGIN),
  rateLimit: {
    windowMinutes: parseNumber(process.env.RATE_LIMIT_WINDOW_MINUTES, 20),
    max: parseNumber(process.env.RATE_LIMIT_MAX, 100),
    authMax: parseNumber(process.env.AUTH_RATE_LIMIT_MAX, 20)
  },
  logging: {
    level: process.env.LOG_LEVEL || "info"
  }
};

config.validate = () => {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  if (config.jwt.secret.length < 32) {
    throw new Error("JWT_ACCESS_SECRET must be at least 32 characters.");
  }

  if (config.bcryptRounds < 10) {
    throw new Error("BCRYPT_ROUNDS should be >= 10 for production security.");
  }
};

module.exports = config;
