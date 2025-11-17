require("dotenv").config();
require("events").EventEmitter.defaultMaxListeners = 20;

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
  })
);

app.use(mongoSanitize());
app.use(xss());
app.use(cookieParser());

app.use(express.json({ limit: process.env.JSON_LIMIT }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan(process.env.MORGAN_FORMAT || "dev"));

app.use(
  rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES, 10) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10),
    message: {
      status: "error",
      message: "Too many requests, try again later."
    }
  })
);

mongoose
  .connect(process.env.MONGODB_URI, {
    autoIndex: true
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection failed");
    process.exit(1);
  });

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

app.get("/health", (req, res) =>
  res.status(200).json({
    status: "success",
    message: "running",
    env: process.env.NODE_ENV
  })
);

app.all("*", (req, res) =>
  res.status(404).json({
    status: "error",
    message: `Route ${req.originalUrl} not found`
  })
);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`TaskBackend listening on port ${PORT}`);
});

module.exports = app;
