const User = require("../models/User");
const Product = require("../models/Product");

const success = (res, message, data = {}, status = 200) =>
  res.status(status).json({ status: "success", message, data });

const fail = (res, message, status = 400) =>
  res.status(status).json({ status: "error", message });

const BLOCKED_USER_FIELDS = ["password", "role", "createdAt", "updatedAt"];

exports.registerAdmin = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return fail(res, "Admin already exists with this email.", 409);

    const admin = await User.create({
      name,
      email,
      password,
      role: role || "admin",
    });

    return success(res, "Admin account created successfully.", { admin }, 201);
  } catch (err) {
    next(err);
  }
};

exports.listUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    return success(res, "Users retrieved successfully.", { users });
  } catch (err) {
    next(err);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return fail(res, "User not found.", 404);

    return success(res, "User retrieved successfully.", { user });
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(
        ([key]) => !BLOCKED_USER_FIELDS.includes(key)
      )
    );

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) return fail(res, "User not found.", 404);

    return success(res, "User updated successfully.", { user });
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id)
      return fail(res, "You cannot delete your own account.", 400);

    const user = await User.findById(req.params.id);
    if (!user) return fail(res, "User not found.", 404);

    user.isActive = false;
    user.deletedAt = new Date();
    await user.save();

    return success(res, "User account deactivated successfully.");
  } catch (err) {
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create({
      ...req.body,
      createdBy: req.user.id,
    });

    return success(res, "Product created successfully.", { product }, 201);
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return fail(res, "Product not found.", 404);

    const allowedFields = ["title", "description", "price", "stock"];

    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
    );

    Object.assign(product, updates);
    await product.save();

    return success(res, "Product updated successfully.", { product });
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return fail(res, "Product not found.", 404);

    product.isDeleted = true;
    product.deletedAt = new Date();
    await product.save();

    return success(res, "Product deleted successfully.");
  } catch (err) {
    next(err);
  }
};
