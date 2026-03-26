const JWTUtils = require("../utils/jwt");
const User = require("../models/User");
const tokenBlacklist = require("../services/tokenBlacklist");
const config = require("../config/env");

const success = (res, message, data = {}, status = 200) =>
  res.status(status).json({ status: "success", message, data });

const fail = (res, message, status = 400) =>
  res.status(status).json({ status: "error", message });

const tokenResponse = (user) => {
  const accessToken = JWTUtils.generateToken({ id: user._id.toString(), role: user.role });
  return {
    user: user.toJSON(),
    accessToken,
    expiresIn: config.jwt.expiresIn
  };
};

const authController = {
  register: async (req, res, next) => {
    try {
      const { name, email, password } = req.body;
      const existing = await User.findOne({ email }).lean();
      if (existing) return fail(res, "User already exists with this email.", 409);

      const user = await User.create({
        name,
        email,
        password,
        role: "user"
      });

      return success(res, "Registration successful.", tokenResponse(user), 201);
    } catch (err) {
      next(err);
    }
  },

  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select("+password +deletedAt");
      if (!user || user.deletedAt || !user.isActive) {
        return fail(res, "Invalid email or password.", 401);
      }

      const valid = await user.comparePassword(password);
      if (!valid) return fail(res, "Invalid email or password.", 401);

      user.lastLoginAt = new Date();
      await user.save();

      return success(res, "Login successful.", tokenResponse(user));
    } catch (err) {
      next(err);
    }
  },

  logout: async (req, res, next) => {
    try {
      tokenBlacklist.revoke(req.token, req.tokenPayload.exp);
      return success(res, "Logout successful.");
    } catch (err) {
      next(err);
    }
  },

  logoutAll: async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return fail(res, "User not found.", 404);

      const nowSeconds = Math.floor(Date.now() / 1000);
      user.passwordChangedAt = new Date(nowSeconds * 1000);
      await user.save();

      tokenBlacklist.revokeAllForUser(req.user.id, nowSeconds);
      return success(res, "Logged out from all devices.");
    } catch (err) {
      next(err);
    }
  },

  getMe: async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).select("-password -deletedAt").lean();
      return success(res, "", { user });
    } catch (err) {
      next(err);
    }
  },

  changePassword: async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user.id).select("+password");
      if (!user) return fail(res, "User not found.", 404);

      const valid = await user.comparePassword(currentPassword);
      if (!valid) return fail(res, "Current password is incorrect.", 401);

      user.password = newPassword;
      user.passwordChangedAt = new Date();
      await user.save();

      return success(res, "Password changed successfully. Please log in again.");
    } catch (err) {
      next(err);
    }
  }
};

module.exports = authController;
