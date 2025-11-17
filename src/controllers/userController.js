const User = require("../models/User");

const success = (res, message, data = {}, status = 200) =>
  res.status(status).json({ status: "success", message, data });

const fail = (res, message, status = 400) =>
  res.status(status).json({ status: "error", message });

const BLOCKED_FIELDS = [
  "password",
  "role",
  "isActive",
  "emailVerified",
  "createdAt",
  "updatedAt",
  "lastLoginAt",
  "passwordChangedAt",
];

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return fail(res, "User already exists with this email.", 409);

    const user = await User.create({
      name,
      email,
      password,
      role: role || "user",
    });

    return success(res, "Account created successfully.", { user }, 201);
  } catch (err) {
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return fail(res, "User not found", 404);
    return success(res, "", { user });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => !BLOCKED_FIELDS.includes(key))
    );

    if (!Object.keys(updates).length)
      return fail(res, "No valid fields to update.", 422);

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) return fail(res, "User not found", 404);
    return success(res, "Profile updated", { user });
  } catch (err) {
    next(err);
  }
};

exports.deleteProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return fail(res, "User not found", 404);

    user.isActive = false;
    user.deletedAt = new Date();
    await user.save();

    return success(res, "Account deactivated");
  } catch (err) {
    next(err);
  }
};
