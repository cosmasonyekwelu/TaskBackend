require("dotenv").config();

const config = require("./config/env");
const createApp = require("./app");
const { connectDb } = require("./lib/db");
const logger = require("./lib/logger");

const startServer = async () => {
  try {
    config.validate();
    await connectDb(config.mongodbUri);
    logger.info("MongoDB connected");

    const app = createApp();
    app.listen(config.port, () => {
      logger.info("TaskBackend server started", { port: config.port });
    });
  } catch (error) {
    logger.error("Server startup failed", { err: error.message, stack: error.stack });
    process.exit(1);
  }
};

startServer();
