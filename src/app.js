require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");

const config = require("./config/env");
const requestLogger = require("./middleware/requestContext");
const metricsMiddleware = require("./middleware/metrics");
const metrics = require("./lib/metrics");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const errorHandler = require("./middleware/errorHandler");

const createRateLimiter = (maxRequests, message) =>
  rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    windowMs: config.rateLimit.windowMinutes * 60 * 1000,
    max: maxRequests,
    message: {
      status: "error",
      message
    }
  });

const createApp = () => {
  const app = express();

  app.set("trust proxy", 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }
    })
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || config.corsOrigins.includes("*") || config.corsOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error("CORS origin not allowed."));
      },
      credentials: true
    })
  );

  app.use(requestLogger);
  app.use(metricsMiddleware);
  app.use(mongoSanitize());
  app.use(xss());
  app.use(express.json({ limit: config.jsonLimit }));
  app.use(express.urlencoded({ extended: true, limit: config.jsonLimit }));

  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "success",
      message: "healthy",
      timestamp: new Date().toISOString()
    });
  });

  app.get("/ready", (req, res) => {
    const mongoose = require("mongoose");
    const dbState = mongoose.connection.readyState;
    const ready = dbState === 1;
    res.status(ready ? 200 : 503).json({
      status: ready ? "success" : "error",
      message: ready ? "ready" : "database not connected",
      dbState
    });
  });

  app.get("/metrics", (req, res) => {
    res.status(200).json({ status: "success", data: metrics.snapshot() });
  });

  app.use("/api/auth", createRateLimiter(config.rateLimit.authMax, "Too many auth requests."), authRoutes);
  app.use("/api/products", createRateLimiter(config.rateLimit.max, "Too many requests, try again later."), productRoutes);
  app.use("/api/users", createRateLimiter(config.rateLimit.max, "Too many requests, try again later."), userRoutes);
  app.use("/api/admin", createRateLimiter(config.rateLimit.max, "Too many requests, try again later."), adminRoutes);

  app.all("*", (req, res) =>
    res.status(404).json({
      status: "error",
      message: `Route ${req.originalUrl} not found`
    })
  );

  app.use(errorHandler);

  return app;
};

module.exports = createApp;
