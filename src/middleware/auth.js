const JWTUtils = require("../utils/jwt");
const User = require("../models/User");
const tokenBlacklist = require("../services/tokenBlacklist");
const { observeAuthFailure } = require("../lib/metrics");

const fail = (res, message, status = 401, reason = "auth_failure") => {
  observeAuthFailure(reason);
  return res.status(status).json({ status: "error", message });
};

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return fail(res, "Access denied. No token provided.", 401, "missing_token");
    }

    const token = authHeader.split(" ")[1];
    if (tokenBlacklist.isRevoked(token)) {
      return fail(res, "Token has been revoked. Please log in again.", 401, "revoked_token");
    }

    let decoded;
    try {
      decoded = JWTUtils.verifyToken(token);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return fail(res, "Token has expired. Please log in again.", 401, "expired_token");
      }

      return fail(res, "Invalid token. Please log in again.", 401, "invalid_token");
    }

    if (tokenBlacklist.isUserLoggedOutAfter(decoded.id, decoded.iat)) {
      return fail(res, "Session is no longer valid. Please log in again.", 401, "logout_all");
    }

    const user = await User.findById(decoded.id).select("+password +deletedAt");
    if (!user) return fail(res, "User no longer exists.", 401, "user_missing");
    if (!user.isActive || user.deletedAt) {
      return fail(res, "Account has been deactivated.", 401, "inactive_account");
    }

    if (user.passwordChangedAt) {
      const changedAt = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < changedAt) {
        return fail(res, "Password was changed. Please log in again.", 401, "password_changed");
      }
    }

    req.user = user;
    req.token = token;
    req.tokenPayload = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticate };
