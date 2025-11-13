const JWTUtils = require("../utils/jwt");
const User = require("../models/User");

const fail = (res, message, status = 401) =>
  res.status(status).json({ status: "error", message });

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return fail(res, "Access denied. No token provided.");
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = JWTUtils.verifyToken(token);
    } catch (err) {
      if (err.name === "TokenExpiredError")
        return fail(res, "Token has expired. Please log in again.");
      return fail(res, "Invalid token. Please log in again.");
    }

    const user = await User.findById(decoded.id);
    if (!user) return fail(res, "User no longer exists.");
    if (!user.isActive) return fail(res, "Account has been deactivated.");

    if (user.passwordChangedAt) {
      const changedAt = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < changedAt) {
        return fail(res, "Password was changed. Please log in again.");
      }
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return fail(res, "Authentication failed.", 500);
  }
};

module.exports = { authenticate };
