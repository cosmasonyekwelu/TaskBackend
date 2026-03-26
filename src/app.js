require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const compression = require("compression");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const mongoose = require("mongoose");

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

  app.set("trust proxy", true);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }
    })
  );

  app.use(compression());

  const allowAllOrigins = config.corsOrigins.includes("*");
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowAllOrigins || config.corsOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error("CORS origin not allowed."));
      },
      credentials: allowAllOrigins ? false : true
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

  app.get("/", (req, res) => {
    res.status(200).json({
      status: "success",
      message: "TaskBackend API",
      links: {
        health: "/health",
        ready: "/ready",
        metrics: "/metrics",
        docs: "/api/docs"
      }
    });
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

/**
 * Allow running `node src/app.js` directly (e.g., when a hosting platform
 * start command is misconfigured) by bootstrapping the server here. The
 * preferred entrypoint remains `src/server.js`.
 */
if (require.main === module) {
  const logger = require("./lib/logger");
  const { connectDb } = require("./lib/db");
  const config = require("./config/env");
  let server;

  (async () => {
    try {
      config.validate();
      await connectDb(config.mongodbUri);
      const app = createApp();
      server = app.listen(config.port, () => {
        logger.info("TaskBackend server started (app.js direct)", { port: config.port });
      });

      const gracefulShutdown = (signal) => {
        logger.info("Received shutdown signal", { signal });
        const timeout = setTimeout(() => {
          logger.error("Forced shutdown after timeout");
          process.exit(1);
        }, 10000);

        if (server) {
          server.close(async () => {
            try {
              await mongoose.disconnect();
              logger.info("MongoDB disconnected");
            } catch (err) {
              logger.error("Error during Mongo disconnect", { err: err.message });
            }
            clearTimeout(timeout);
            process.exit(0);
          });
        } else {
          clearTimeout(timeout);
          process.exit(0);
        }
      };

      process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
      process.on("SIGINT", () => gracefulShutdown("SIGINT"));
      process.on("uncaughtException", (err) => {
        logger.error("Uncaught Exception", { err: err.message, stack: err.stack });
        process.exit(1);
      });
      process.on("unhandledRejection", (reason) => {
        logger.error("Unhandled Rejection", { reason });
        process.exit(1);
      });
    } catch (error) {
      logger.error("Direct app.js startup failed", { err: error.message, stack: error.stack });
      process.exit(1);
    }
  })();
}
