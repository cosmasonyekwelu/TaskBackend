require("dotenv").config();

const config = require("./config/env");
const createApp = require("./app");
const { connectDb, mongoose } = require("./lib/db");
const logger = require("./lib/logger");

config.validate();

let server;

const registerProcessHandlers = () => {
  process.on("uncaughtException", (err) => {
    logger.error("Uncaught Exception", { err: err.message, stack: err.stack });
    process.exit(1);
  });

  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled Rejection", { reason });
    process.exit(1);
  });
};

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

const startServer = async () => {
  try {
    await connectDb(config.mongodbUri);
    logger.info("MongoDB connected");

    const app = createApp();
    server = app.listen(config.port, () => {
      logger.info("TaskBackend server started", { port: config.port });
    });

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    logger.error("Server startup failed", { err: error.message, stack: error.stack });
    process.exit(1);
  }
};

registerProcessHandlers();
startServer();
