const JWTUtils = require("../utils/jwt");
const User = require("../models/User");

const success = (res, message, data = {}, status = 200) =>
  res.status(status).json({ status: "success", message, data });

const fail = (res, message, status = 400) =>
  res.status(status).json({ status: "error", message });

const authController = {
  register: async (req, res, next) => {
    try {
      const { name, email, password, role } = req.body;
      const existing = await User.findOne({ email });
      if (existing) return fail(res, "User already exists with this email.", 409);

      const user = await User.create({
        name,
        email,
        password,
        role: role || "user",
      });

      const accessToken = JWTUtils.generateToken({ id: user._id });

      return success(
        res,
        "Registration successful.",
        { user: user.toJSON(), accessToken, expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "24h" },
        201
      );
    } catch (err) {
      next(err);
    }
  },

  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select("+password");
      if (!user) return fail(res, "Invalid email or password.", 401);
      if (!user.isActive) return fail(res, "Account has been deactivated.", 401);

      const valid = await user.comparePassword(password);
      if (!valid) return fail(res, "Invalid email or password.", 401);

      user.lastLoginAt = new Date();
      await user.save();

      const accessToken = JWTUtils.generateToken({ id: user._id });

      return success(res, "Login successful.", {
        user: user.toJSON(),
        accessToken,
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "24h",
      });
    } catch (err) {
      next(err);
    }
  },

  logout: async (req, res, next) => {
    try {
      return success(res, "Logout successful.");
    } catch (err) {
      next(err);
    }
  },

  logoutAll: async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return fail(res, "User not found.", 404);

      user.passwordChangedAt = new Date();
      await user.save();

      return success(res, "Logged out from all devices.");
    } catch (err) {
      next(err);
    }
  },

  getMe: async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).select("-password");
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
  },
};

module.exports = authController;
